import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { startOfDay } from "date-fns";
import { AppointmentStatus, PaymentStatus } from "@/generated/prisma";

export const dynamic = "force-dynamic";

// Cancela agendamentos que ficaram PENDING (não pagos) em dias que já passaram.
// Antes, este arquivo era uma cópia do cron de lembretes e não limpava nada, deixando
// slots ocupados por reservas abandonadas.
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Só dias anteriores a hoje — não mexe em PENDING de hoje que ainda podem ser pagos.
    const cutoff = startOfDay(new Date());

    const stale = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.PENDING,
        date: { lt: cutoff },
      },
      include: { payment: true },
    });

    if (stale.length === 0) {
      return NextResponse.json({ success: true, scanned: 0, cancelled: 0 });
    }

    let cancelled = 0;

    for (const appt of stale) {
      try {
        await prisma.$transaction([
          prisma.appointmentHistory.create({
            data: {
              originalId: appt.id,
              userId: appt.userId,
              doctorId: appt.doctorId,
              date: appt.date,
              status: AppointmentStatus.CANCELLED,
              reason: "AUTO_EXPIRED_UNPAID",
              amount: appt.payment?.amount ?? appt.amount ?? 0,
            },
          }),
          prisma.appointment.update({
            where: { id: appt.id },
            data: { status: AppointmentStatus.CANCELLED },
          }),
          ...(appt.payment
            ? [
                prisma.payment.update({
                  where: { id: appt.payment.id },
                  data: { status: PaymentStatus.CANCELLED },
                }),
              ]
            : []),
        ]);
        cancelled++;
      } catch (err) {
        console.error(`Falha ao expirar agendamento ${appt.id}:`, err);
      }
    }

    console.log(`🧹 [Cleanup] ${cancelled}/${stale.length} agendamentos PENDING expirados cancelados.`);

    return NextResponse.json({ success: true, scanned: stale.length, cancelled });
  } catch (error) {
    console.error("Erro no Cron de Limpeza:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
