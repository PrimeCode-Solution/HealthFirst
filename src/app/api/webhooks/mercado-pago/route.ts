import { paymentClient, preApprovalClient } from "@/lib/mercadopago";
import { prisma } from "@/app/providers/prisma";
import crypto from "crypto";
import { NextResponse } from "next/server";

function validateSignature(body: string, signature: string | null, requestId: string | null): boolean {
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || process.env.MP_WEBHOOK_SECRET;
    if (!secret || !signature || !requestId) return true;

    try {
        const parts = signature.split(',');
        let ts, v1;
        parts.forEach(p => {
            const [k, v] = p.split('=');
            if (k.trim() === 'ts') ts = v;
            if (k.trim() === 'v1') v1 = v;
        });

        if (!ts || !v1) return false;

        const manifest = `id:${JSON.parse(body).data?.id};request-id:${requestId};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

        return hmac === v1;
    } catch {
        return false;
    }
}

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get("x-signature");
        const requestId = req.headers.get("x-request-id");

        if (process.env.NODE_ENV === 'production' && process.env.MP_WEBHOOK_SECRET) {
             if (!validateSignature(bodyText, signature, requestId)) {
                console.error("[Webhook] Assinatura inválida");
                return new Response("Invalid Signature", { status: 401 });
             }
        }

        const body = JSON.parse(bodyText);
        const { id: eventId, action, type, data } = body;
        const resourceId = data?.id;

        if (eventId) {
            const processedEvent = await prisma.processedWebhookEvent.findUnique({
                where: { eventId: String(eventId) }
            });

            if (processedEvent && processedEvent.processed) {
                return new Response("Already Processed", { status: 200 });
            }
        }

        if (!resourceId) {
             return new Response("No Resource ID", { status: 200 });
        }

        await prisma.$transaction(async (tx) => {
            
            if (action === "payment.created") {
                console.log(`[Webhook] Payment created notificaton: ${resourceId}`);
            }
            
            else if (type === "payment" || action === "payment.updated") {
                console.log(`[Webhook] Processando pagamento ID: ${resourceId}`);
                
                const payment = await paymentClient.get({ id: resourceId });
                
                let status = "PENDING";
                if (payment.status === "approved") status = "CONFIRMED";
                else if (payment.status === "rejected") status = "REJECTED";
                else if (payment.status === "cancelled") status = "CANCELLED";
                else if (payment.status === "refunded") status = "REFUNDED";

                let dbPayment = await tx.payment.findFirst({
                    where: { 
                        OR: [
                            { mercadoPagoId: String(resourceId) }, 
                            { appointmentId: payment.external_reference }
                        ] 
                    }
                });

                if (dbPayment) {
                    console.log(`[Webhook] Pagamento encontrado. Atualizando...`);
                    
                    await tx.payment.update({
                        where: { id: dbPayment.id },
                        data: { 
                            status: status as any, 
                            mercadoPagoId: String(resourceId), 
                            paidAt: status === "CONFIRMED" ? new Date() : dbPayment.paidAt 
                        }
                    });

                    if (dbPayment.appointmentId) {
                         if (status === "CONFIRMED") {
                            await tx.appointment.update({
                                where: { id: dbPayment.appointmentId },
                                data: { status: "CONFIRMED" }
                            });
                            console.log(`[Webhook] Agendamento ${dbPayment.appointmentId} confirmado!`);
                         } else if (status === "REJECTED" || status === "CANCELLED") {
                            await tx.appointment.update({ where: { id: dbPayment.appointmentId }, data: { status: "CANCELLED" } });
                         }
                    }
                } 
                
                else {
                    const possibleAppointmentId = payment.external_reference;
                    
                    if (possibleAppointmentId) {
                        console.log(`[Webhook] Buscando agendamento: ${possibleAppointmentId}`);
                        
                        const appointment = await tx.appointment.findUnique({
                            where: { id: possibleAppointmentId }
                        });

                        if (appointment) {
                            await tx.payment.create({
                                data: {
                                    mercadoPagoId: String(resourceId),
                                    amount: payment.transaction_amount || 0,
                                    currency: payment.currency_id || "BRL",
                                    description: payment.description || "Pagamento de Consulta", 
                                    status: status as any,
                                    paymentMethod: payment.payment_method_id || "unknown",
                                    payerEmail: payment.payer?.email || "unknown",
                                    appointmentId: appointment.id,
                                    paidAt: status === "CONFIRMED" ? new Date() : null
                                }
                            });

                            if (status === "CONFIRMED") {
                                await tx.appointment.update({
                                    where: { id: appointment.id },
                                    data: { status: "CONFIRMED" }
                                });
                                console.log(`[Webhook] Pagamento criado e Agendamento confirmado!`);
                            }
                        } else {
                             const subscriptionId = payment.metadata?.subscription_id || payment.external_reference; 
                             if (subscriptionId) {
                                 const subscription = await tx.subscription.findFirst({
                                     where: { OR: [{ preapprovalId: subscriptionId }, { userId: payment.external_reference }] }
                                 });
         
                                 if (subscription) {
                                     await tx.payment.create({
                                         data: {
                                             mercadoPagoId: String(resourceId),
                                             amount: payment.transaction_amount || 0,
                                             currency: payment.currency_id || "BRL",
                                             description: payment.description || "Mensalidade Assinatura",
                                             status: "CONFIRMED",
                                             paymentMethod: payment.payment_method_id,
                                             payerEmail: payment.payer?.email,
                                             subscriptionId: subscription.id,
                                             paidAt: new Date()
                                         }
                                     });
                                     
                                     await tx.subscription.update({
                                         where: { id: subscription.id },
                                         data: { status: 'ACTIVE' }
                                     });
                                 }
                             }
                        }
                    }
                }
            }

            else if (type === "subscription_preapproval") {
                const sub = await preApprovalClient.get({ id: resourceId });
                let status = "INACTIVE";
                if (sub.status === "authorized") status = "ACTIVE";
                else if (sub.status === "cancelled") status = "CANCELLED";
                
                await tx.subscription.updateMany({
                    where: { preapprovalId: String(resourceId) },
                    data: { status: status as any }
                });
            }

            if (eventId) {
                await tx.processedWebhookEvent.upsert({
                    where: { eventId: String(eventId) },
                    update: { processed: true, processedAt: new Date() },
                    create: {
                        eventId: String(eventId),
                        type: type || "unknown",
                        action: action || "unknown",
                        processed: true,
                        processedAt: new Date()
                    }
                });
            }
        });

        return new Response("OK", { status: 200 });

    } catch (error) {
        console.error("Webhook Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}