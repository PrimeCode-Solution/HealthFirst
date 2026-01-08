import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const history = await prisma.appointmentHistory.findMany({
      orderBy: { archivedAt: 'desc' }, 
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        },
        doctor: {
          select: { name: true }
        }
      },
      take: 100 
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Erro API History:", error); 
    return NextResponse.json({ error: "Erro ao buscar histórico" }, { status: 500 });
  }
}