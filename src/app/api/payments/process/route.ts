import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/app/providers/prisma";
import { sendAppointmentConfirmation } from "@/lib/whatsapp";
import { getSessionUser } from "@/lib/auth-guards";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;

const client = new MercadoPagoConfig({
    accessToken: mpAccessToken || "",
});

const paymentClient = new Payment(client);

export async function POST(req: Request) {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser) {
            return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401 });
        }

        const body = await req.json();
        const { formData, appointmentId } = body;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || "http://localhost:3000";

        const existingPayment = await prisma.payment.findFirst({
             where: { appointmentId },
             include: {
                appointment: {
                    include: { user: true }
                }
             }
        });

        if (!existingPayment) {
             return new Response(JSON.stringify({ error: "Pagamento não encontrado" }), { status: 404 });
        }

        // Ownership: só o dono do agendamento (ou um ADMIN) pode processar o pagamento.
        if (existingPayment.appointment?.userId !== sessionUser.id && sessionUser.role !== "ADMIN") {
            return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403 });
        }

        // Guard de idempotência: se já está confirmado, não cria uma nova cobrança no
        // Mercado Pago (evita cobrança dupla em retry/duplo-clique).
        if (existingPayment.status === "CONFIRMED") {
            return new Response(JSON.stringify({
                id: existingPayment.mercadoPagoId,
                status: "approved",
                alreadyPaid: true,
            }), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        const payerEmail = formData.payer?.email || 
                           existingPayment.appointment?.patientEmail || 
                           existingPayment.appointment?.user?.email || 
                           "email_nao_informado@healthfirst.com";

        const identificationNumber = formData.payer?.identification?.number || "";
        const identificationType = formData.payer?.identification?.type || "CPF";

        // PIX e boleto não enviam token/installments/issuer_id: mandá-los como NaN/undefined
        // faz o Mercado Pago rejeitar a transação.
        const isCardPayment = Boolean(formData.token);

        const payer: Record<string, any> = {
            ...(formData.payer || {}),
            email: payerEmail,
        };

        if (identificationNumber) {
            payer.identification = { type: identificationType, number: identificationNumber };
        } else {
            delete payer.identification;
        }

        const paymentData: Record<string, any> = {
            transaction_amount: Number(existingPayment.amount),
            description: existingPayment.description || "Consulta Médica",
            payment_method_id: formData.payment_method_id,
            external_reference: appointmentId.toString(),
            payer,
            metadata: {
                appointment_id: appointmentId.toString()
            },
            notification_url: `${baseUrl}/api/webhooks/mercado-pago`
        };

        if (isCardPayment) {
            paymentData.token = formData.token;
            paymentData.installments = Number(formData.installments) || 1;
            if (formData.issuer_id) paymentData.issuer_id = formData.issuer_id;
        }

        const response = await paymentClient.create({ body: paymentData });
        
        const statusBanco = response.status === 'approved' ? "CONFIRMED" : "PENDING";
        
        await prisma.payment.update({
            where: { id: existingPayment.id },
            data: { 
                mercadoPagoId: response.id?.toString(),
                status: statusBanco as any,
                paymentMethod: formData.payment_method_id,
                paidAt: statusBanco === "CONFIRMED" ? new Date() : null
            }
        });

        if (statusBanco === "CONFIRMED") {
            await prisma.appointment.update({
                where: { id: appointmentId },
                data: { status: "CONFIRMED" }
            });

            // 👇 CORREÇÃO: Adicionado AWAIT para segurar o processo na Vercel
            try {
                const appt = existingPayment.appointment;
                
                if (appt) {
                    const phone = appt.patientPhone || appt.user?.phone;
                    const patientName = appt.patientName || appt.user?.name || "Paciente";
    
                    if (phone) {
                        const dateFormatted = format(new Date(appt.date), "dd/MM 'às'", { locale: ptBR });
                        const timeFormatted = appt.startTime; 
                        const dateAndHour = `${dateFormatted} ${timeFormatted}`;
    
                        console.log(`🚀 [Process Payment] Pagamento Aprovado. Aguardando envio WhatsApp para ${phone}...`);
                        
                        await sendAppointmentConfirmation(phone, patientName, dateAndHour);
                        
                        console.log("✅ [Process Payment] WhatsApp enviado e confirmado.");
                    } else {
                        console.warn("⚠️ [Process Payment] Telefone não encontrado.");
                    }
                }
            } catch (error) {
                // Loga o erro mas não trava o pagamento
                console.error("❌ [Process Payment] Erro no envio do WhatsApp (mas pagamento ok):", error);
            }
        }

        return new Response(JSON.stringify({
            id: response.id,
            status: response.status,
            detail: response.status_detail,
            point_of_interaction: response.point_of_interaction 
        }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });

    } catch (error: any) {
        console.error("Erro ao processar pagamento:", error);
        return new Response(JSON.stringify({ 
            error: error.message || "Erro desconhecido",
            status: error.status || 500 
        }), { status: error.status || 500 });
    }
}