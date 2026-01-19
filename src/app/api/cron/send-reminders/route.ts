import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { addDays, startOfDay, endOfDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
        const doctorName = appointment.doctor?.name || "Dr(a). Especialista";
        
        const timeFormatted = appointment.startTime.slice(0, 5); 

        if (phone) {
          const dateFormatted = format(appointment.date, "dd/MM 'às'", { locale: ptBR });
          const dateAndHour = `${dateFormatted} ${timeFormatted}`;

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
            console.error(`Falha envio WhatsApp para ID ${appointment.id}`);
            errorCount++;
          }
        } else {
          console.warn(`Agendamento ${appointment.id} sem telefone válido.`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Falha ao processar agendamento ${appointment.id}`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: appointments.length,
      sent_success: successCount,
      sent_errors: errorCount,
    });

  } catch (error: any) {
    console.error("Erro no Cron de Lembretes:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}