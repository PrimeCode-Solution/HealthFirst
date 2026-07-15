import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { z } from "zod";
import { randomInt } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const GENERIC_MESSAGE = "Se o e-mail existir, você receberá instruções.";

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
    }

    // Código de 6 dígitos com RNG criptográfico (Math.random é previsível e não
    // deve ser usado para segredos). Validade curta reduz a janela de brute-force.
    const resetToken = randomInt(100000, 1000000).toString();
    const passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: passwordResetExpires,
        resetPasswordAttempts: 0, // zera o contador de tentativas a cada novo código
      },
    });

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error("Forgot Password Email Error:", emailError);
      await prisma.user.update({
        where: { email },
        data: {
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      return NextResponse.json(
        { error: "Servico de e-mail indisponivel no momento." },
        { status: 503 }
      );
    }

    // Mesma mensagem do caso "usuário não existe" para não permitir enumeração de e-mails.
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação." },
      { status: 500 }
    );
  }
}