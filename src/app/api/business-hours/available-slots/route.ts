import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import {
  generateDaySlots,
  resolveDaySchedule,
} from "@/modules/business-hours/domain/weeklySchedule";

export const dynamic = "force-dynamic";

/**
 * "YYYY-MM-DD" é interpretado pelo JS como meia-noite UTC; como o dia da semana
 * e a janela de agendamentos são lidos no fuso local do servidor, em fusos
 * negativos (America/Sao_Paulo) isso escorregava a consulta para o dia anterior.
 * Datas curtas viram meia-noite local; formatos com instante explícito passam direto.
 */
function parseRequestDate(raw: string): Date | null {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParameter = searchParams.get("date");
    const doctorId = searchParams.get("doctorId");

    if (!dateParameter) {
      return NextResponse.json({ error: "Date not Provided" }, { status: 400 });
    }

    if (!doctorId) {
      return NextResponse.json({ error: "Doctor ID not Provided" }, { status: 400 });
    }

    const date = parseRequestDate(dateParameter);
    if (!date) {
      return NextResponse.json({ error: "Invalid Date" }, { status: 400 });
    }

    const dayOfWeek = date.getDay();

    const configurations = await prisma.businessHours.findUnique({
      where: { doctorId: doctorId },
      include: { days: true },
    });

    if (!configurations) {
      return NextResponse.json(
        { error: "Configurations not found for this doctor" },
        { status: 404 },
      );
    }

    // Escala específica do dia da semana; cai nos campos globais quando o médico
    // ainda não configurou aquele dia individualmente.
    const daySchedule = resolveDaySchedule(configurations, dayOfWeek);

    if (!daySchedule.enabled) {
      return NextResponse.json([], { status: 200 });
    }

    const slots = generateDaySlots(daySchedule);

    const startDay = new Date(date);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(date);
    endDay.setHours(23, 59, 59, 999);

    const busyAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorId,
        date: {
          gte: startDay,
          lte: endDay,
        },
        status: { not: "CANCELLED" },
      },
      select: { startTime: true },
    });

    // Normaliza para "HH:mm": alguns registros têm startTime como "HH:mm:ss", e a
    // comparação exata deixava esses horários (já ocupados) aparecerem como livres.
    const busyTimes = new Set(busyAppointments.map((a) => a.startTime.slice(0, 5)));
    const availableTimes = slots.filter((slot) => !busyTimes.has(slot));

    return NextResponse.json(availableTimes, { status: 200 });
  } catch (err) {
    console.error("Available Slots Error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
