import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ userId: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      const params = await props.params;
      const { userId } = params;
  
      if (session.user.id !== userId && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
  
      const body = await req.json();
      const dataToUpdate: any = {};
  
      if (body.name !== undefined) dataToUpdate.name = body.name;
      if (body.email !== undefined) dataToUpdate.email = body.email;
      if (body.phone !== undefined) dataToUpdate.phone = body.phone;
      if (Object.keys(dataToUpdate).length === 0) {
          return NextResponse.json({ message: "Nothing to update" });
      }
  
      const updated = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate
      });
  
      return NextResponse.json(updated);
  
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      return NextResponse.json(
          { error: "Internal Error", details: String(error) }, 
          { status: 500 }
      );
    }
  }