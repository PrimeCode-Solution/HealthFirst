import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { sendVideoLink } from "@/lib/whatsapp";
import { startOfDay, endOfDay, format, differenceInMinutes, parse, addHours } from "date-fns";

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

    const appointments = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        videoUrl: { not: null },
        videoLinkSent: false,
        date: { gte: searchStart, lte: searchEnd }
      },
      include: { user: true },
    });

    const logs: string[] = [];
    let sentCount = 0;

    if (appointments.length === 0) {
        return NextResponse.json({ 
            message: "NENHUM AGENDAMENTO ENCONTRADO NO BANCO.",
            debug: {
                serverTimeUTC: now.toISOString(),
                filterStart: searchStart.toISOString(),
                filterEnd: searchEnd.toISOString()
            }
        });
    }

    for (const app of appointments) {
      try {
        const appointmentDateStr = format(app.date, "yyyy-MM-dd");
        
        let appointmentDateTime = parse(
          `${appointmentDateStr} ${app.startTime}`, 
          "yyyy-MM-dd HH:mm", 
          new Date()
        );

        appointmentDateTime = addHours(appointmentDateTime, 3);
        const minutesUntil = differenceInMinutes(appointmentDateTime, now);
        
        const logMsg = `ID: ${app.id} | Data: ${appointmentDateStr} | Hora: ${app.startTime} | Diff: ${minutesUntil}min`;
        logs.push(logMsg);

        if (minutesUntil >= -20 && minutesUntil <= 40) {
          
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
               logs.push(`--> ENVIADO SUCESSO`);
             } else {
               logs.push(`--> ERRO WHATSAPP`);
             }
          }
        } else {
            logs.push(`--> FORA DA JANELA (-20 a 40)`);
        }
      } catch (err) {
        logs.push(`--> ERRO CATCH: ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      found: appointments.length,
      sent: sentCount,
      logs: logs 
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Internal Error", details: error.message }, { status: 500 });
  }
}