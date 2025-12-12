import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/app/providers/prisma";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN as string });
const preApprovalClient = new PreApproval(client);

const getBaseUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, price, reason } = body;

    // Fallback de e-mail para Sandbox (para não dar erro de mesmo comprador/vendedor)
    const payerEmail = process.env.NODE_ENV === 'production' 
        ? session.user.email ?? `no-email-${Date.now()}@example.com`
        : `sub_test_${Date.now()}@test.com`;

    // 1. Criar Assinatura no MP
    const subscription = await preApprovalClient.create({
      body: {
        reason: reason || `Assinatura - ${title}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: Number(price),
          currency_id: "BRL"
        },
        back_url: `${getBaseUrl()}/dashboard/assinatura/processando`,
        payer_email: payerEmail,
        external_reference: session.user.id,
        status: "pending"
      }
    });

    // 2. Salvar no Banco
    await prisma.subscription.upsert({
        where: { userId: session.user.id },
        update: {
            preapprovalId: subscription.id!,
            planName: title,
            amount: Number(price),
            status: 'INACTIVE',
            mercadoPagoId: subscription.id
        },
        create: {
            userId: session.user.id,
            preapprovalId: subscription.id!,
            planName: title,
            amount: Number(price),
            status: 'INACTIVE',
            mercadoPagoId: subscription.id
        }
    });

    return NextResponse.json({ 
        init_point: subscription.init_point,
        id: subscription.id 
    });

  } catch (error: any) {
    console.error("Erro ao criar assinatura:", error);
    return NextResponse.json({ error: "Erro ao processar assinatura" }, { status: 500 });
  }
}