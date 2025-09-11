import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/src/generated/prisma";

const prisma = new PrismaClient();

// Função para consultar status na API do Mercado Pago
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

    // Verificar se a assinatura está ativa no MP
    return subscription.status === "authorized";
  } catch (error) {
    console.error("Erro ao verificar assinatura no MP:", error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const { userId } = params;

    // Buscar o usuário com sua assinatura local
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

    // Se não tem assinatura cadastrada, não tem acesso
    if (!user.subscription?.preapprovalId) {
      return NextResponse.json({ hasAccess: false });
    }

    // Consultar status atual no Mercado Pago
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
