import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/app/providers/prisma";
import { NextResponse } from "next/server";
import { sendAppointmentConfirmation } from "@/lib/whatsapp";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;

const client = new MercadoPagoConfig({
    accessToken: mpAccessToken || "",
});

const paymentClient = new Payment(client);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const paymentId = searchParams.get("id");

        if (!paymentId) {
            return NextResponse.json({ error: "ID do pagamento obrigatório" }, { status: 400 });
        }

        const mpPayment = await paymentClient.get({ id: paymentId });
        
        let statusSistema = "PENDING";
        if (mpPayment.status === "approved") statusSistema = "CONFIRMED";
        else if (mpPayment.status === "cancelled") statusSistema = "CANCELLED";
        else if (mpPayment.status === "rejected") statusSistema = "REJECTED";

        const existingPayment = await prisma.payment.findFirst({
            where: { mercadoPagoId: paymentId }
        });

        if (existingPayment && existingPayment.status !== statusSistema) {
            await prisma.payment.update({
                where: { id: existingPayment.id },
                data: { 
                    status: statusSistema as any,
                    paidAt: statusSistema === "CONFIRMED" ? new Date() : existingPayment.paidAt
                }
            });

            if (statusSistema === "CONFIRMED" && existingPayment.appointmentId) {
                // Atualiza o agendamento e busca dados para o WhatsApp
                const updatedAppt = await prisma.appointment.update({
                    where: { id: existingPayment.appointmentId },
                    data: { status: "CONFIRMED" },
                    include: { user: true }
                });

                try {
                    const phone = updatedAppt.patientPhone || updatedAppt.user?.phone;
                    const patientName = updatedAppt.patientName || updatedAppt.user?.name || "Paciente";

                    if (phone) {
                        const dateFormatted = format(new Date(updatedAppt.date), "dd/MM 'às'", { locale: ptBR });
                        const timeFormatted = updatedAppt.startTime; 
                        const dateAndHour = `${dateFormatted} ${timeFormatted}`;

                        console.log(`🚀 [Check Status] Enviando confirmação WhatsApp para ${phone}`);
                        
                        // Não aguarda o envio para não travar a resposta da API (fire and forget)
                        sendAppointmentConfirmation(phone, patientName, dateAndHour)
                            .then(() => console.log("✅ [Check Status] WhatsApp enviado com sucesso."))
                            .catch((err) => console.error("❌ [Check Status] Falha ao enviar WhatsApp:", err));
                    }
                } catch (error) {
                    console.error("❌ [Check Status] Erro ao processar envio de WhatsApp:", error);
                }
            }
        }

        return NextResponse.json({ status: statusSistema });

    } catch (error) {
        console.error("Erro ao verificar status:", error);
        return NextResponse.json({ status: "ERROR" }, { status: 500 });
    }
}