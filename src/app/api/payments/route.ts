import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { PaymentStatus } from "@/generated/prisma";
import { requireAdmin } from "@/lib/auth-guards";

// Mapeia o registro do Prisma para o shape de domínio esperado pelo paymentRepository
// (amount como number, null → undefined).
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

// GET /api/payments — lista/gestão (admin). Suporta filtros por query:
//   ?mercadoPagoId= → retorna um único pagamento (ou null)
//   ?appointmentId= / ?subscriptionId= → retorna array filtrado
//   sem filtro → todos os pagamentos
export async function GET(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get("appointmentId");
    const subscriptionId = searchParams.get("subscriptionId");
    const mercadoPagoId = searchParams.get("mercadoPagoId");

    // Busca única por mercadoPagoId (o repositório espera um objeto, não array).
    if (mercadoPagoId) {
      const payment = await prisma.payment.findUnique({ where: { mercadoPagoId } });
      return NextResponse.json(payment ? toDTO(payment) : null);
    }

    const where: any = {};
    if (appointmentId) where.appointmentId = appointmentId;
    if (subscriptionId) where.subscriptionId = subscriptionId;

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments.map(toDTO));
  } catch (error) {
    console.error("Erro ao listar pagamentos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/payments — cria um registro de pagamento manualmente (admin).
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const body = await req.json();

    if (body.amount == null || Number.isNaN(Number(body.amount))) {
      return NextResponse.json({ error: "amount é obrigatório e deve ser numérico." }, { status: 400 });
    }
    if (!body.description) {
      return NextResponse.json({ error: "description é obrigatória." }, { status: 400 });
    }
    if (body.status && !(body.status in PaymentStatus)) {
      return NextResponse.json({ error: "status inválido." }, { status: 400 });
    }

    const created = await prisma.payment.create({
      data: {
        appointmentId: body.appointmentId ?? null,
        subscriptionId: body.subscriptionId ?? null,
        mercadoPagoId: body.mercadoPagoId ?? null,
        preferenceId: body.preferenceId ?? null,
        amount: Number(body.amount),
        currency: body.currency || "BRL",
        description: body.description,
        status: (body.status as PaymentStatus) || PaymentStatus.PENDING,
        payerEmail: body.payerEmail ?? null,
        payerName: body.payerName ?? null,
        payerPhone: body.payerPhone ?? null,
      },
    });

    return NextResponse.json(toDTO(created), { status: 201 });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um pagamento para este agendamento." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
