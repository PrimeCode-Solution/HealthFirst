import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { sendVideoLink } from "@/lib/whatsapp";
import { startOfDay, endOfDay, differenceInMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const dynamic = "force-dynamic";

const TIME_ZONE = "America/Sao_Paulo";

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
        date: { gte: todayStart, lte: todayEnd },
        status: "CONFIRMED",  
        videoUrl: { not: null }, 
        videoLinkSent: false,    
      },
      include: { user: true },
    });

    if (appointments.length === 0) {
      console.log("CRON VIDEO: Nenhum agendamento confirmado pendente de envio.");
      return NextResponse.json({ message: "Nenhum link pendente." });
    }

    let sentCount = 0;
    let errors = 0;

    for (const app of appointments) {
      try {
        // O dia é guardado como meia-noite UTC (dia-calendário em UTC) e o startTime é
        // horário local do Brasil. Interpretamos a data no fuso do Brasil e convertemos
        // para o instante UTC real — sem depender do fuso do servidor nem do antigo
        // "+3h" hardcoded (que só funcionava por acaso num servidor UTC).
        const appointmentDateStr = formatInTimeZone(app.date, "UTC", "yyyy-MM-dd");
        const appointmentDateTime = fromZonedTime(`${appointmentDateStr} ${app.startTime}`, TIME_ZONE);

        const minutesUntil = differenceInMinutes(appointmentDateTime, now);

        console.log(`🔎 Check ID: ${app.id} | Hora: ${app.startTime} | Faltam: ${minutesUntil} min`);

        if (minutesUntil >= -20 && minutesUntil <= 40) {
          
          console.log(`🚀 Enviando link para ${app.startTime}...`);
          
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
               console.error(`❌ Falha no envio WhatsApp para ${app.id}`);
               errors++;
             }
          }
        } else {
            console.log(`⏳ Aguardando janela de tempo (-20 a 40 min).`);
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