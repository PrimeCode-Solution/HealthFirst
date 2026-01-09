import { prisma } from "@/app/providers/prisma";
import crypto from "crypto";
import { AppointmentStatus, SubscriptionStatus, PaymentStatus } from "@/generated/prisma";
import { paymentClient, preApprovalClient, MP_WEBHOOK_SECRET } from "@/lib/mercadopago";

function validateSignature(body: string, signature: string | null, requestId: string | null): boolean {
    if (!MP_WEBHOOK_SECRET) return true; 
    if (!signature || !requestId) return false;

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
        const hmac = crypto.createHmac('sha256', MP_WEBHOOK_SECRET).update(manifest).digest('hex');

        return hmac === v1;
    } catch { return false; }
}

export async function POST(req: Request) {
    let currentEventId: string | null = null;

    try {
        const bodyText = await req.text();
        const signature = req.headers.get("x-signature");
        const requestId = req.headers.get("x-request-id");

        if (process.env.NODE_ENV === 'production' && MP_WEBHOOK_SECRET) {
            if (!validateSignature(bodyText, signature, requestId)) {
                return new Response("Invalid Signature", { status: 401 });
            }
        }

        const body = JSON.parse(bodyText);
        const { type, data, action } = body;
        const eventId = String(body.id); 
        const resourceId = String(data?.id);
        currentEventId = eventId;

        if (!resourceId || !eventId) return new Response("No ID", { status: 200 });

        const existingEvent = await prisma.processedWebhookEvent.findUnique({ where: { eventId } });
        if (existingEvent?.processed) return new Response("Already Processed", { status: 200 });

        await prisma.processedWebhookEvent.upsert({
            where: { eventId },
            create: { eventId, type, action, attempts: 1 },
            update: { attempts: { increment: 1 } }
        });

        if (type === "payment") {
            const payment = await paymentClient.get({ id: resourceId });
            
            const statusMap: Record<string, PaymentStatus> = {
                'approved': 'CONFIRMED',
                'rejected': 'REJECTED',
                'cancelled': 'CANCELLED'
            };
            const status = statusMap[payment.status!] || "PENDING";

            const dbPayment = await prisma.payment.findFirst({
                where: { OR: [{ mercadoPagoId: resourceId }, { appointmentId: payment.external_reference }] }
            });

            if (dbPayment) {
                await prisma.$transaction(async (tx) => {
                    await tx.payment.update({
                        where: { id: dbPayment.id },
                        data: { status, mercadoPagoId: resourceId, paidAt: status === "CONFIRMED" ? new Date() : undefined }
                    });

                    if (dbPayment.appointmentId) {
                        const apptStatus = status === "CONFIRMED" ? "CONFIRMED" : 
                                         (status === "REJECTED" || status === "CANCELLED" ? "CANCELLED" : "PENDING");
                        await tx.appointment.update({
                            where: { id: dbPayment.appointmentId },
                            data: { status: apptStatus as AppointmentStatus }
                        });
                    }

                    await tx.processedWebhookEvent.update({ where: { eventId }, data: { processed: true, processedAt: new Date() } });
                });
                return new Response("OK", { status: 200 });
            }

            if (status === "CONFIRMED") {
                const subId = payment.metadata?.subscription_id || payment.external_reference;
                await prisma.$transaction(async (tx) => {
                    const sub = await tx.subscription.findFirst({ where: { OR: [{ preapprovalId: subId }, { userId: payment.external_reference }] } });
                    if (sub) {
                        await tx.payment.create({
                            data: {
                                mercadoPagoId: resourceId,
                                amount: payment.transaction_amount || 0,
                                currency: payment.currency_id || "BRL",
                                status: "CONFIRMED",
                                subscriptionId: sub.id,
                                paidAt: new Date(),
                                description: payment.description || "Assinatura"
                            }
                        });
                    }
                    await tx.processedWebhookEvent.update({ where: { eventId }, data: { processed: true, processedAt: new Date() } });
                });
                return new Response("OK", { status: 200 });
            }

            console.error(`[Webhook Error] Payment ${resourceId} not found.`);
            return new Response("Not Handled", { status: 200 });
        }

        if (type === "subscription_preapproval") {
            const sub = await preApprovalClient.get({ id: resourceId });
            const subStatusMap: Record<string, SubscriptionStatus> = {
                'authorized': 'ACTIVE',
                'cancelled': 'CANCELLED'
            };
            const status = subStatusMap[sub.status!] || "INACTIVE";
            
            await prisma.$transaction([
                prisma.subscription.updateMany({ where: { preapprovalId: resourceId }, data: { status } }),
                prisma.processedWebhookEvent.update({ where: { eventId }, data: { processed: true, processedAt: new Date() } })
            ]);
            return new Response("OK", { status: 200 });
        }

        return new Response("OK", { status: 200 });

    } catch (error: any) {
        console.error("Webhook Error:", error);
        if (currentEventId) {
            await prisma.processedWebhookEvent.update({
                where: { eventId: currentEventId },
                data: { error: error.message }
            }).catch(() => {});
        }
        return new Response("Error", { status: 500 });
    }
}