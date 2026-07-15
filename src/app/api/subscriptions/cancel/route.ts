import { NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/app/providers/prisma";

const client = new MercadoPagoConfig({
  accessToken: (process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || "") as string,
});
const preApprovalClient = new PreApproval(client);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription || !subscription.preapprovalId) {
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });
    }

    await preApprovalClient.update({
      id: subscription.preapprovalId,
      body: {
        status: "cancelled",
      },
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ message: "Assinatura cancelada com sucesso" });

  } catch (error: any) {
    console.error("Erro ao cancelar assinatura:", error);
    return NextResponse.json({ error: "Erro ao cancelar assinatura" }, { status: 500 });
  }
}