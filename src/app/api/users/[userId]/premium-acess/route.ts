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

    if (!user.subscription?.preapprovalId) {
      return NextResponse.json({ hasAccess: false });
    }

    const hasAccess = await checkSubscriptionStatusMP(
      user.subscription.preapprovalId,
    );

    return NextResponse.json({ hasAccess });
  } catch (error) {
    console.error("Erro ao verificar acesso premium:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}