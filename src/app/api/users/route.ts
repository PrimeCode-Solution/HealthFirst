import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const roleFilter = url.searchParams.get("role");

    const session = await getServerSession(authOptions);

    // A listagem pública de médicos (?role=DOCTOR) é o único acesso anônimo permitido.
    // Qualquer outra consulta exige admin ou médico.
    if (roleFilter !== "DOCTOR") {
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "DOCTOR")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    // Contato (e-mail/telefone) só é exposto a admin/médico. Público vê apenas nome.
    const canSeeContact = session?.user.role === "ADMIN" || session?.user.role === "DOCTOR";

    const where: any = {};

    if (roleFilter) {
      where.role = roleFilter;
    } else if (session?.user.role === "DOCTOR") {
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
      orderBy: { name: 'asc' }
    });

    const sanitized = users.map((u) => ({
      ...u,
      email: canSeeContact ? u.email : null,
      phone: canSeeContact ? u.phone : null,
    }));

    return NextResponse.json({ success: true, data: { users: sanitized } });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const body = await req.json();
    
    if (!body.email || !body.name || !body.password) {
      return NextResponse.json({ error: "Nome, email e senha são obrigatórios." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Este email já está cadastrado." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: body.role || "USER",
        password: hashedPassword,
      }
    });

    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}