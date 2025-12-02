import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    let targetUserId = session.user.id;
    
    const queryUserId = url.searchParams.get("doctorId");
    if (session.user.role === "ADMIN" && queryUserId) {
      targetUserId = queryUserId;
    }

    const configurations = await prisma.businessHours.findUnique({
      where: { doctorId: targetUserId },
    });

    return NextResponse.json(configurations || {}, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    
    let targetUserId = session.user.id;

    if (session.user.role === "ADMIN" && body.doctorId) {
      targetUserId = body.doctorId;
    } else if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Limpeza e Validação dos dados
    const { 
        id, 
        doctorId, 
        createdAt, 
        updatedAt,
        appointmentDuration,
        ...data 
    } = body;

    const updated = await prisma.businessHours.upsert({
      where: { doctorId: targetUserId },
      update: { 
          ...data,
          appointmentDuration: Number(appointmentDuration) 
      },
      create: { 
          ...data, 
          appointmentDuration: Number(appointmentDuration), 
          doctorId: targetUserId 
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("Erro ao salvar BusinessHours:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}