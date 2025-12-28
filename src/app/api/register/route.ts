import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password } = registerSchema.parse(body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ message: "Este e-mail já está cadastrado." }, { status: 409 });
      }
      if (existingUser.phone === phone) {
        return NextResponse.json({ message: "Este telefone já está cadastrado." }, { status: 409 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "USER",
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dados inválidos.", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Erro interno ao criar conta." },
      { status: 500 }
    );
  }
}