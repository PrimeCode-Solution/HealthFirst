import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/app/providers/prisma";
import { NextResponse } from "next/server";

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
                await prisma.appointment.update({
                    where: { id: existingPayment.appointmentId },
                    data: { status: "CONFIRMED" }
                });
            }
        }

        return NextResponse.json({ status: statusSistema });

    } catch (error) {
        console.error("Erro ao verificar status:", error);
        return NextResponse.json({ status: "ERROR" }, { status: 500 });
    }
}