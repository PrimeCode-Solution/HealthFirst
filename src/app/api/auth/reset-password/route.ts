import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const resetPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
  token: z.string().min(1),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, token, password } = resetPasswordSchema.parse(body);

    // Lookup pelo e-mail (não pelo token): assim conseguimos contar tentativas erradas
    // do código e travar após o limite, fechando o brute-force do código de 6 dígitos.
    const user = await prisma.user.findUnique({ where: { email } });

    // Mensagem genérica para não revelar se o e-mail existe ou tem reset ativo.
    const genericInvalid = () =>
      NextResponse.json({ error: "Código inválido ou expirado." }, { status: 400 });

    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      return genericInvalid();
    }

    if (user.resetPasswordExpires < new Date()) {
      return genericInvalid();
    }

    // Excedeu o limite de tentativas: invalida o código e exige novo pedido.
    if (user.resetPasswordAttempts >= MAX_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: null, resetPasswordExpires: null, resetPasswordAttempts: 0 },
      });
      return NextResponse.json(
        { error: "Muitas tentativas. Solicite um novo código." },
        { status: 429 }
      );
    }

    // Código incorreto: incrementa o contador e rejeita.
    if (user.resetPasswordToken !== token) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordAttempts: { increment: 1 } },
      });
      return genericInvalid();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        resetPasswordAttempts: 0,
      },
    });

    return NextResponse.json(
      { message: "Senha redefinida com sucesso!" },
      { status: 200 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { error: "Erro ao redefinir senha." },
      { status: 500 }
    );
  }
}