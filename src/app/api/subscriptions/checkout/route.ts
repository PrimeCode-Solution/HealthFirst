import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/app/providers/prisma";
import { v4 as uuidv4 } from "uuid";

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ accessToken: accessToken || "" });
const preApprovalClient = new PreApproval(client);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token, payer, price, planName } = body;

    if (!token) {
      return NextResponse.json({ error: "Token do cartão ausente" }, { status: 400 });
    }

    // Sempre usar o usuário da sessão. Nunca confiar em um userId vindo do body:
    // caso contrário um usuário logado poderia sobrescrever a assinatura de outro.
    const targetUserId = session.user.id;
    const payerEmail = payer?.email || session.user.email;

    const subscription = await preApprovalClient.create({
      body: {
        reason: planName || "Assinatura HealthFirst",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: Number(price),
          currency_id: "BRL"
        },
        payer_email: payerEmail, 
        card_token_id: token,
        status: "authorized",
        back_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        external_reference: String(targetUserId),
      },
      requestOptions: {
        idempotencyKey: uuidv4(), 
      }
    });

    const dbSub = await prisma.subscription.upsert({
      where: { userId: targetUserId },
      update: {
        preapprovalId: subscription.id!,
        planName,
        amount: Number(price),
        status: subscription.status === 'authorized' ? 'ACTIVE' : 'INACTIVE',
      },
      create: {
        userId: targetUserId,
        preapprovalId: subscription.id!,
        planName,
        amount: Number(price),
        status: subscription.status === 'authorized' ? 'ACTIVE' : 'INACTIVE',
      }
    });


    return NextResponse.json({ id: subscription.id, status: subscription.status });

  } catch (error: any) {
    console.error("Erro MP Subscription:", error);
    return NextResponse.json({ 
      error: "Erro no Mercado Pago",
      details: error.message || "Erro desconhecido",
      status: error.status || 500
    }, { status: error.status || 500 });
  }
}