import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma"; 
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/email";

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
      return NextResponse.json(
        { message: "Se o e-mail existir, você receberá instruções." },
        { status: 200 }
      );
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordResetExpires = new Date(Date.now() + 3600000); 

    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: passwordResetExpires,
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

    return NextResponse.json(
      { message: "E-mail enviado com sucesso." },
      { status: 200 }
    );
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