import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { subMinutes } from "date-fns";
import { sendPendingPixMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    console.log("🕒 [Cron Log] Iniciando limpeza de agendamentos...");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error("🔒 [Cron Log] Falha de autenticação");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const timeLimit = subMinutes(new Date(), 20);
    
    console.log(`🕒 [Cron Log] Buscando agendamentos anteriores a: ${timeLimit.toISOString()}`);

    const pendingAppointments = await prisma.appointment.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: timeLimit },
      },
      include: {
        user: true,
        payment: true,
        doctor: true, 
      },
    });

    console.log(`🔎 [Cron Log] Encontrados ${pendingAppointments.length} agendamentos pendentes antigos.`);

    let cancelledCount = 0;
    let remindersSent = 0;

    for (const appointment of pendingAppointments) {
      console.log(`👉 [Cron Log] Processando ID: ${appointment.id} | Status Atual: ${appointment.status}`);

      if (appointment.paymentReminderSent) {
        console.log("   ↳ Já recebeu lembrete. Cancelando...");
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { status: "CANCELLED" },
        });
        cancelledCount++;
        continue;
      }

      const hasOtherValidAppointment = await prisma.appointment.findFirst({
        where: {
          userId: appointment.userId,
          id: { not: appointment.id },
          status: "CONFIRMED",
        },
      });

      if (hasOtherValidAppointment) {
        console.log("   ↳ Tem outro agendamento CONFIRMED. Cancelando silenciosamente...");
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { status: "CANCELLED" },
        });
        cancelledCount++;
      } else {
        console.log("   ↳ Tentando enviar lembrete...");
        
        if (appointment.patientPhone && appointment.payment?.preferenceId) {
            const checkoutLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://healthfirst.com.br"}/dashboard/assinatura/processando?preferenceId=${appointment.payment.preferenceId}`;
            const doctorName = appointment.doctor?.name || "Clínica HealthFirst";

            console.log(`   ↳ Dados: Paciente=${appointment.patientName}, Médico=${doctorName}, Link=${checkoutLink}`);

            await sendPendingPixMessage(
                appointment.patientPhone,
                appointment.patientName,
                doctorName,
                checkoutLink
            );
        } else {
            console.warn("   ⚠️ [Cron Log] Faltando telefone ou preferenceId. Pular envio.");
        }

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { paymentReminderSent: true },
        });
        
        remindersSent++;
      }
    }

    console.log(`✅ [Cron Log] Finalizado. Cancelados: ${cancelledCount}, Lembretes: ${remindersSent}`);

    return NextResponse.json({
      success: true,
      cancelled: cancelledCount,
      remindersSent: remindersSent,
      message: `Cron finalizado. ${cancelledCount} cancelados, ${remindersSent} lembretes enviados.`,
    });

  } catch (error: any) {
    console.error("❌ [Cron Log] Erro fatal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}