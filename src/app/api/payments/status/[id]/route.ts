import { prisma } from "@/app/providers/prisma";

export async function GET(
  _req: Request, 
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  
  try {
    const payment = await prisma.payment.findFirst({
      where: { id: params.id },
    });

    if (!payment) {
      return new Response(
        JSON.stringify({ error: "Pagamento não encontrado" }), 
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        status: payment.status,
        payerEmail: payment.payerEmail,
        amount: payment.amount,
        currency: payment.currency,
        description: payment.description,
        appointmentId: payment.appointmentId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: mensagem }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
