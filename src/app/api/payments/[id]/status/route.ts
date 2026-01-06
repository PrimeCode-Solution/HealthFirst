import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";

export async function GET(
    _req: Request, 
    props: { params: Promise<{ id: string }> }
  ) {
    const params = await props.params;
    
    try {
        const payment = await prisma.payment.findUnique({
            where: { id: params.id }, 
            select: { status: true }
        });

        if(!payment) {
            return NextResponse.json(
                { error: "Pagamento não encontrado" }, 
                { status: 404 }
            );
        }

        return NextResponse.json({ status: payment.status });

    } catch (error) {
        return NextResponse.json(
            { error: "Erro interno ao buscar pagamento" },
            { status: 500 }
        );
    }
}
