import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { success: false, data: null, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const user = {
      id: token.sub,
      email: token.email,
      name: token.name,
      role: token.role
    };

    return await handler(request, user);
  } catch (error) {
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      { success: false, data: null, error: "Erro de autenticação" },
      { status: 500 }
    );
  }
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(request, async (req, user) => {
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, data: null, error: "Acesso negado. Apenas administradores." },
        { status: 403 }
      );
    }
    return await handler(req, user);
  });
}

export async function checkPremiumAccess(userId: string): Promise<boolean> {
  try {
    // Verificar se o usuário tem assinatura ativa
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return false;

    // Verificar status no Mercado Pago se necessário
    if (subscription.preapprovalId) {
      const response = await fetch(
        `https://api.mercadopago.com/preapproval/${subscription.preapprovalId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          },
        }
      );

      if (response.ok) {
        const mpSubscription = await response.json();
        return mpSubscription.status === "authorized";
      }
    }

    return subscription.status === "ACTIVE";
  } catch (error) {
    console.error("Erro ao verificar acesso premium:", error);
    return false;
  }
}