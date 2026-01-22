import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/app/providers/prisma";

const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;

const client = new MercadoPagoConfig({
    accessToken: mpAccessToken || "",
});

const paymentClient = new Payment(client);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { formData, appointmentId } = body;

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

        const payerEmail = formData.payer?.email || 
                           existingPayment.appointment?.patientEmail || 
                           existingPayment.appointment?.user?.email || 
                           "email_nao_informado@healthfirst.com";

        const identificationType = formData.payer?.identification?.type || "CPF";
        const identificationNumber = formData.payer?.identification?.number || "";

        const paymentData = {
            transaction_amount: Number(existingPayment.amount),
            token: formData.token,
            description: existingPayment.description || "Consulta Médica",
            installments: Number(formData.installments),
            payment_method_id: formData.payment_method_id,
            issuer_id: formData.issuer_id,
            external_reference: appointmentId.toString(),
            payer: {
                email: payerEmail,
                identification: {
                    type: identificationType,
                    number: identificationNumber,
                },
            },
            metadata: {
                appointment_id: appointmentId.toString()
            },
            notification_url: `${baseUrl}/api/webhooks/mercado-pago`
        };

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