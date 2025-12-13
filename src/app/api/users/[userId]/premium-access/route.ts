
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

async function checkSubscriptionStatusMP(
  preapprovalId: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.mercadopago.com/preapproval/${preapprovalId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      },
    );

    if (!response.ok) {
      console.error("Erro ao consultar MP:", response.status);
      return false;
    }

    const subscription = await response.json();
    return subscription.status === "authorized";
  } catch (error) {
    console.error("Erro ao verificar assinatura no MP:", error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const { userId } = params;

    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const subscription = user.subscription;

    // Se não tem assinatura cadastrada, não tem acesso
    if (!subscription?.preapprovalId) {
      return NextResponse.json({ hasAccess: false });
    }

    let currentStatus = subscription.status;

    const now = new Date();
    const updatedAt = subscription.updatedAt ?? subscription.createdAt;
    const diffMs = now.getTime() - updatedAt.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Se passar de 24h, confirma status com Mercado Pago
    if (diffHours >= 24) {
      const isActiveInMP = await checkSubscriptionStatusMP(subscription.preapprovalId);

      const newStatus = isActiveInMP ? "authorized" : "cancelled";

      // Só atualiza o banco se o status tiver mudado
      if (currentStatus !== newStatus) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: newStatus,
            updatedAt: new Date(),
          },
        });

        currentStatus = newStatus;
      }
    }

    const hasAccess = currentStatus === "authorized";

    return NextResponse.json({ hasAccess });
  } catch (error) {
    console.error("Erro ao verificar acesso premium:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}