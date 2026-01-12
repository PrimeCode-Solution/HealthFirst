import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { addDays, startOfDay, endOfDay, format } from "date-fns";
import { sendAppointmentReminder } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tomorrow = addDays(new Date(), 1);
    const startOfTomorrow = startOfDay(tomorrow);
    const endOfTomorrow = endOfDay(tomorrow);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startOfTomorrow,
          lte: endOfTomorrow,
        },
        status: "CONFIRMED", 
        reminderSent: false, 
      },
      include: {
        user: {
          select: { name: true, phone: true },
        },
        doctor: {
          select: { name: true },
        },
      },
    });

    if (appointments.length === 0) {
      return NextResponse.json({ message: "Nenhum lembrete pendente para amanhã." });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const appointment of appointments) {
      try {
        const phone = appointment.patientPhone || appointment.user.phone;
        const patientName = appointment.patientName || appointment.user.name || "Paciente";
        const doctorName = appointment.doctor?.name || "Médico Responsável";
        const time = appointment.startTime; 

        if (phone) {
          const dateFormatted = format(appointment.date, "dd/MM");
          const dateAndHour = `${dateFormatted} às ${time}`;

          const result = await sendAppointmentReminder(
            phone,
            patientName,
            dateAndHour,
            doctorName
          );

          if (result) {
            await prisma.appointment.update({
              where: { id: appointment.id },
              data: { reminderSent: true },
            });
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Falha ao processar agendamento ${appointment.id}`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      processed: appointments.length,
      success: successCount,
      errors: errorCount,
    });

  } catch (error: any) {
    console.error("Erro no Cron:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}