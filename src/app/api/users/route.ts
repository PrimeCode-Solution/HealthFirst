import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Apenas ADMIN e DOCTOR podem ver a lista de usuários
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "DOCTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Busca usuários (Filtra apenas pacientes se for médico, ou todos se for admin)
    const users = await prisma.user.findMany({
      where: {
        role: "USER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: { appointments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: { users } });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}