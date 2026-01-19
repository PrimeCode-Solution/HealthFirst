import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config"; 
import { prisma } from "@/app/providers/prisma";
import { userProfileSchema } from "@/lib/validations/user";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, image, bio, specialty } = userProfileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone,
        image,
        bio,
        specialty,
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ message: "Dados inválidos.", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Erro ao atualizar perfil." }, { status: 500 });
  }
}