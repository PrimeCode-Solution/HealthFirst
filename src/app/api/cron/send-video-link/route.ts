import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { startOfDay, endOfDay, addHours } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const searchStart = startOfDay(addHours(now, -24)); 
    const searchEnd = endOfDay(addHours(now, 24));

    const allAppointments = await prisma.appointment.findMany({
      where: {
        date: { gte: searchStart, lte: searchEnd }
      },
      select: {
        id: true,
        startTime: true,
        status: true,        
        videoUrl: true,      
        videoLinkSent: true, 
        patientName: true,
        user: { select: { name: true, phone: true } }
      }
    });

    const report = allAppointments.map(app => {
      let problem = "OK (Deveria enviar)";
      
      if (app.status !== "CONFIRMED") problem = `Status errado: ${app.status}`;
      else if (!app.videoUrl) problem = "Sem Link de Vídeo (videoUrl nulo/vazio)";
      else if (app.videoLinkSent) problem = "Já enviado (videoLinkSent = true)";
      
      return {
        hora: app.startTime,
        paciente: app.patientName || app.user.name,
        status: app.status,
        temLink: !!app.videoUrl,
        jaEnviou: app.videoLinkSent,
        DIAGNOSTICO: problem
      };
    });

    return NextResponse.json({
      totalEncontrados: allAppointments.length,
      analise: report
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Internal Error", details: error.message }, { status: 500 });
  }
}