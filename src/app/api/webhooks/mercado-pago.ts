import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/app/providers/prisma";
import crypto from "crypto";
import { PaymentStatus } from "@/generated/prisma";

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN as string,
});
const paymentClient = new Payment(client);


export async function POST (req: Request){
    try {
        const signature = req.headers.get("x-signature") || "";
        
        const parts = Object.fromEntries(
            signature.split(",").map(p => p.trim().split("="))
        );

        const receivedHash = parts["hash"];

        const idempotencyKey = req.headers.get("x-idempotency-key");
        const bodyText = await req.text();


        if(!signature || !process.env.MP_WEBHOOK_SECRET) {
        return new Response("Assinatura inválida", { status: 401});
        }
        
        const hash = crypto.createHmac("sha256", process.env.MP_WEBHOOK_SECRET).update(bodyText).digest("hex");
        
        if(hash !== receivedHash) {
            return new Response("Assinatura inválida", { status: 401 })
        }
        
        
        const body = JSON.parse(bodyText);

        await prisma.webhookEvent.create({
            data: {
                action: body.action,
                apiVersion: body.api_version,
                dataId: body.data?.id,
                dateCreated: new Date(body.data_created),
                type: body.type,
                processed: false,
                rawData: JSON.stringify(body),
                
            },
        });

        const mercadoPagoId = body.data?.id || body.id;
        if(!mercadoPagoId) {
            return new Response("ID do pagamento não encontrado", { status: 400});

        }

        const mpPayment = await paymentClient.get({ id: mercadoPagoId});

        function mapStatus(status: string | undefined): PaymentStatus | undefined {
        switch (status) {
        case "pending":
            return "PENDING";
        case "approved":
            return "APPROVED";
        case "rejected":
            return "REJECTED";
        
        default:
            return undefined;    
    }
}
         

        const updatedPayment = await prisma.payment.update({
            where: { mercadoPagoId : mpPayment.id?.toString() },
            data: { 
            status: mapStatus(mpPayment.status ?? ""),
            payerEmail: mpPayment.payer?.email,
            payerName: mpPayment.payer?.first_name,
            amount: mpPayment.transaction_amount ?? 0,
            currency: mpPayment.currency_id,
            description: mpPayment.description ?? "",
            paidAt: mpPayment.status === "approved" ? new Date() : undefined,
        },
        });

            if(mpPayment.status === "approved" && updatedPayment.appointmentId){
                await prisma.appointment.update({
                    where: { id: updatedPayment.appointmentId },
                    data: { status: "CONFIRMED"}
                });
            }
        
            return new Response("OK", { status: 200});

    }catch (error) {
        const mensagem = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Erro no webhook MP:", mensagem);

        return new Response(
            JSON.stringify({ error: mensagem }), 
            { status: 500, headers: { "Content-Type": "application/json"} })
    }
}