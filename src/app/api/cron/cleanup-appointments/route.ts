import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { subMinutes } from "date-fns";
import { sendPendingPixMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const timeLimit = subMinutes(new Date(), 20);

    const pendingAppointments = await prisma.appointment.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: timeLimit,
        },
      },
      include: {
        user: true,
        payment: true, 
      },
    });

    let cancelledCount = 0;
    let remindersSent = 0;

    for (const appointment of pendingAppointments) {
      if (appointment.paymentReminderSent) {
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
          status: { in: ["CONFIRMED"] },
        },
      });

      if (hasOtherValidAppointment) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { status: "CANCELLED" },
        });
        cancelledCount++;
      } else {
        // CORREÇÃO AQUI: Verifica se existe 'payment' e 'preferenceId' dentro dele
        if (appointment.patientPhone && appointment.payment?.preferenceId) {
            
            const checkoutLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://seusite.com"}/dashboard/assinatura/processando?preferenceId=${appointment.payment.preferenceId}`;
            
            await sendPendingPixMessage(
                appointment.patientPhone,
                appointment.patientName,
                checkoutLink
            );
        }

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { paymentReminderSent: true },
        });
        
        remindersSent++;
      }
    }

    return NextResponse.json({
      success: true,
      cancelled: cancelledCount,
      remindersSent: remindersSent,
      message: `Cron finalizado. ${cancelledCount} cancelados, ${remindersSent} lembretes enviados.`,
    });

  } catch (error: any) {
    console.error("Erro no cron:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}