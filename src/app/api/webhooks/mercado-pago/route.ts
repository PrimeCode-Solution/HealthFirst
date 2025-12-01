import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/app/providers/prisma";
import crypto from "crypto";
import { PaymentStatus } from "@/generated/prisma";

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN as string,
});
const paymentClient = new Payment(client);

function mapStatus(status: string | undefined): PaymentStatus | undefined {
    switch(status){
        case "pending":
            return "PENDING";
        case "approved":
            return  "CONFIRMED";
        case "rejected":
            return "REJECTED";
        case "cancelled":
            return "CANCELLED";
        case "refunded":
            return "REFUNDED";
        default:
            return undefined;
    }
}

async function isEventAlreadyProcessed(eventId: string): Promise<boolean> {
    const existingEvent = await prisma.processedWebhookEvent.findUnique({
        where: { eventId },
    });

    return existingEvent?.processed === true;
}

async function registerEventProcessing(
    eventId: string,
    type: string,
    action: string
) : Promise<void> {
    await prisma.processedWebhookEvent.upsert({
        where: { eventId },
        create: {
            eventId,
            type,
            action,
            processed: false,
            attempts: 1,
        },
        update: {
            attempts: { increment: 1 },
            updatedAt: new Date(),
        }
    });
}

async function registerEventError(eventId: string, error: string): Promise<void> {
    await prisma.processedWebhookEvent.update({
        where: { eventId },
        data: {
            error,
            updatedAt: new Date(),
        },
    }).catch(() => {

    });
}

export async function POST (req: Request){
    const startTime = Date.now()
    try {
        const signature = req.headers.get("x-signature") || "";
        
        if(!signature || !process.env.MP_WEBHOOK_SECRET) {
            console.error("[Webhook] Erro: Assinatura ausente ou secret não configurado");
            return new Response("Assinatura inválida", { status: 401 });
        }

        const parts = Object.fromEntries(
            signature.split(",").map(p => p.trim().split("="))
        );

        const receivedHash = parts["hash"];

        const bodyText = await req.text();
            
        const hash = crypto
        .createHmac("sha256", process.env.MP_WEBHOOK_SECRET)
        .update(bodyText)
        .digest("hex");
        
        if(hash !== receivedHash) {
        console.error("[Webhook] Erro: Hash inválido", {
            received: receivedHash,
            calculated: hash,
        });
            return new Response("Assinatura inválida", { status: 401 })
        }
        
        const body = JSON.parse(bodyText);

        console.log("[Webhook] Webhook recebido:", {
            eventId: body.id,
            type: body.type,
            action: body.action,
            dataId: body.data?.id,
        });
        
        const eventId = body.id?.toString();
        if(!eventId) {
            console.error("[Webhook] Id do evento não encontrado no payload");
            return new Response("ID do evento não encontrado", { status: 400 });
        }

        const alreadyProcessed = await isEventAlreadyProcessed(eventId);
        if (alreadyProcessed) {
            console.log("[Webhook] Erro - Evento já processado (duplicado):", eventId);
            return new Response(
                JSON.stringify({
                    received: true,
                    duplicate: true,
                    eventId,
                }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
        
        await registerEventProcessing(eventId, body.type, body.action);

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
            const errorMsg = "ID do pagamento não encontrado";
            await registerEventError(eventId, errorMsg);          
            return new Response(errorMsg, { status: 400});

        }

        console.log("[Webhook] Buscando pagamento no MP:", mercadoPagoId);
        const mpPayment = await paymentClient.get({ id: mercadoPagoId});

        await prisma.$transaction(async (tx) => {

        const updatedPayment = await tx.payment.update({
            where: { mercadoPagoId : mpPayment.id?.toString() },
            data: { 
            status: mapStatus(mpPayment.status ?? ""),
            payerEmail: mpPayment.payer?.email,
            payerName: mpPayment.payer?.first_name,
            amount: mpPayment.transaction_amount ?? 0,
            currency: mpPayment.currency_id,
            description: mpPayment.description ?? "",
            paidAt: mpPayment.status === "approved" ? new Date() : undefined,
            updatedAt: new Date(),
        },
        });

            if(mpPayment.status === "approved" && updatedPayment.appointmentId){
                await tx.appointment.update({
                    where: { id: updatedPayment.appointmentId },
                    data: { status: "CONFIRMED", 
                    updatedAt: new Date(),
                }
                });
            }

            if (mpPayment.status === "rejected" && updatedPayment.appointmentId) {
                await tx.appointment.update({
                   where: { id: updatedPayment.appointmentId },
                   data: {
                    status: "CANCELLED",
                    updatedAt: new Date()
                   }
                });
            }

            await tx.processedWebhookEvent.update({
                  where: { eventId },
                  data: {
                      processed: true,
                      processedAt: new Date(),
                      updatedAt: new Date(),
                  },
            });
            
            await tx.webhookEvent.updateMany({
                where: { dataId: mercadoPagoId },
                data: { processed: true },
            });
        }); 
        
        const processingTime = Date.now() - startTime;

        console.log("[Webhook] Processado com sucesso:", {
            eventId,
            paymentId: mercadoPagoId,
            status: mpPayment.status,
            processingTime: `${processingTime}ms`,
        });

        return new Response(
            JSON.stringify({
                received: true,
                eventId,
                processingTime,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );

    }catch (error) {
        const processingTime = Date.now() - startTime;
        const mensagem = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Erro no webhook MP:", {
            error: mensagem,
            processingTime: `${processingTime}ms`,
        });
        
        try{
            const bodyText = await req.clone().text();
            const body = JSON.parse(bodyText);
            const eventId = body.id?.toString();
            if(eventId) {
                await registerEventError(eventId, mensagem);
            }
        } catch {

        }

        return new Response(
            JSON.stringify({ error: mensagem }), 
            { status: 500, headers: { "Content-Type": "application/json"},
        });
    }
}

export async function GET() {
    return new Response(
        JSON.stringify({
            status: "ok",
            message: "Webhook Mercado Pago está ativo",
            timestamp: new Date().toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
    );
}