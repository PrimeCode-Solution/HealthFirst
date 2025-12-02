import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { UserRole } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Apenas ADMIN e DOCTOR podem listar usuários
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "DOCTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const roleFilter = url.searchParams.get("role"); // Pega o filtro ?role=DOCTOR

    const where: any = {};


    if (roleFilter) {
      where.role = roleFilter;
    } else if (session.user.role === "DOCTOR") {
      where.role = "USER";
    }

    const users = await prisma.user.findMany({
      where,
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