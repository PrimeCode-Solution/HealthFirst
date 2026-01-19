import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/app/providers/prisma";
import { changePasswordSchema } from "@/lib/validations/user";
import { compare, hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
    }

    const isPasswordValid = await compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: "A senha atual está incorreta." }, { status: 400 });
    }

    const hashedPassword = await hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Senha alterada com sucesso." });

  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ message: "Dados inválidos.", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Erro ao alterar senha." }, { status: 500 });
  }
}