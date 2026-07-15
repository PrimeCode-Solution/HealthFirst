import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { PaymentStatus } from "@/generated/prisma";
import { getSessionUser, requireAdmin } from "@/lib/auth-guards";

export async function GET(
    _req: Request,
    props: { params: Promise<{ id: string }> }
  ) {
    const params = await props.params;

    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser) {
            return new Response(JSON.stringify({ error: "Não autenticado" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const payment = await prisma.payment.findFirst({
            where: {
                OR: [
                    { appointmentId: params.id },
                    { mercadoPagoId: params.id },
                    { id: params.id }
                ]
            },
            include: {
                appointment: { select: { userId: true } },
                subscription: { select: { userId: true } },
            },
        });

        if(!payment) {
            return new Response(JSON.stringify({ error: "Pagamento não encontrado"}),
            { status: 404, headers: {"Content-Type": "application/json"}}
         );
        }

        // Só o dono do pagamento (via agendamento/assinatura) ou um ADMIN pode vê-lo.
        const ownerId = payment.appointment?.userId ?? payment.subscription?.userId ?? null;
        const isOwner = ownerId !== null && ownerId === sessionUser.id;
        if (!isOwner && sessionUser.role !== "ADMIN") {
            return new Response(JSON.stringify({ error: "Acesso negado" }),
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({
                id: payment.id,
                status: payment.status,
                payerEmail: payment.payerEmail,
                amount: payment.amount,
                currency: payment.currency,
                description: payment.description,
                appointmentId: payment.appointmentId,
                mercadoPagoId: payment.mercadoPagoId
            }),
            { status: 200, headers: { "Content-Type": "application/json" }}
        );
    } catch (error) {
        const mensagem = error instanceof Error ? error.message : "Erro desconhecido";
        return new Response(
            JSON.stringify({ error: mensagem }),
            { status: 500, headers: { "Content-Type": "application/json"}}
        );
    }
}

function toDTO(p: any) {
    return {
        id: p.id,
        appointmentId: p.appointmentId ?? undefined,
        subscriptionId: p.subscriptionId ?? undefined,
        mercadoPagoId: p.mercadoPagoId ?? undefined,
        preferenceId: p.preferenceId ?? undefined,
        amount: Number(p.amount),
        currency: p.currency,
        description: p.description,
        status: p.status,
        payerEmail: p.payerEmail ?? undefined,
        payerName: p.payerName ?? undefined,
        payerPhone: p.payerPhone ?? undefined,
    };
}

// PATCH /api/payments/[id] — atualiza um pagamento (admin).
export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        if (!(await requireAdmin())) {
            return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
        }

        const { id } = await props.params;
        const body = await req.json();

        // Whitelist de campos atualizáveis.
        const data: Record<string, any> = {};
        if (body.status !== undefined) {
            if (!(body.status in PaymentStatus)) {
                return NextResponse.json({ error: "status inválido." }, { status: 400 });
            }
            data.status = body.status;
            if (body.status === PaymentStatus.CONFIRMED || body.status === PaymentStatus.APPROVED) {
                data.paidAt = new Date();
            }
        }
        if (body.amount !== undefined) {
            if (Number.isNaN(Number(body.amount))) {
                return NextResponse.json({ error: "amount inválido." }, { status: 400 });
            }
            data.amount = Number(body.amount);
        }
        if (body.description !== undefined) data.description = body.description;
        if (body.mercadoPagoId !== undefined) data.mercadoPagoId = body.mercadoPagoId;
        if (body.preferenceId !== undefined) data.preferenceId = body.preferenceId;
        if (body.payerEmail !== undefined) data.payerEmail = body.payerEmail;
        if (body.payerName !== undefined) data.payerName = body.payerName;
        if (body.payerPhone !== undefined) data.payerPhone = body.payerPhone;

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
        }

        const updated = await prisma.payment.update({ where: { id }, data });
        return NextResponse.json(toDTO(updated));
    } catch (error) {
        console.error("Erro ao atualizar pagamento:", error);
        if ((error as { code?: string })?.code === "P2025") {
            return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
        }
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// DELETE /api/payments/[id] — remove um pagamento (admin).
export async function DELETE(
    _req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        if (!(await requireAdmin())) {
            return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
        }

        const { id } = await props.params;
        await prisma.payment.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro ao deletar pagamento:", error);
        if ((error as { code?: string })?.code === "P2025") {
            return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
        }
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}