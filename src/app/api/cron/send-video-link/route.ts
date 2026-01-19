import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { sendVideoLink } from "@/lib/whatsapp";
import { startOfDay, endOfDay, format, differenceInMinutes, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: "CONFIRMED",
        videoUrl: { not: null }, 
        videoLinkSent: false,    
      },
      include: {
        user: true,
      },
    });

    if (appointments.length === 0) {
      return NextResponse.json({ message: "Nenhum link pendente para agora." });
    }

    let sentCount = 0;
    let errors = 0;

    for (const app of appointments) {
      try {
        const appointmentDateStr = format(app.date, "yyyy-MM-dd");
        const appointmentDateTime = parse(
          `${appointmentDateStr} ${app.startTime}`, 
          "yyyy-MM-dd HH:mm", 
          new Date()
        );

        const minutesUntil = differenceInMinutes(appointmentDateTime, now);

        if (minutesUntil >= 0 && minutesUntil <= 20) {
          
          const phone = app.patientPhone || app.user.phone;
          const patientName = app.patientName || app.user.name || "Paciente";

          if (phone && app.videoUrl) {
             const sent = await sendVideoLink(phone, patientName, app.videoUrl);

             if (sent) {
               await prisma.appointment.update({
                 where: { id: app.id },
                 data: { videoLinkSent: true }
               });
               sentCount++;
             } else {
               errors++;
             }
          }
        }
      } catch (err) {
        console.error(`Erro ao processar consulta ${app.id}:`, err);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: appointments.length,
      sent: sentCount,
      errors: errors
    });

  } catch (error: any) {
    console.error("Cron Video Link Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}