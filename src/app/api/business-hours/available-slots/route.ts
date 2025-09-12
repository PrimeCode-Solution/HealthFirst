import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { addMinutes, format, isWithinInterval, parse } from "date-fns";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    //Pega data da URL
    const dateParameter = request.nextUrl.searchParams.get("date");
    if (!dateParameter) {
      return NextResponse.json({ error: "Date not Provided" }, { status: 400 });
    }
    const date = new Date(dateParameter);
    const dayOfWeek = date.getDay();

    //Pega configurações
    const configurations = await prisma.businessHours.findFirst();
    if (!configurations) {
      return NextResponse.json(
        { error: "Configurations not found" },
        { status: 404 },
      );
    }

    //Associa disponibilidade dos dias ao numero dele na semana
    const weekdayAvailability: Record<number, boolean> = {
      0: configurations.sundayEnabled,
      1: configurations.mondayEnabled,
      2: configurations.tuesdayEnabled,
      3: configurations.wednesdayEnabled,
      4: configurations.thursdayEnabled,
      5: configurations.fridayEnabled,
      6: configurations.saturdayEnabled,
    };
    if (!weekdayAvailability[dayOfWeek]) {
      return NextResponse.json({ error: "Unavailable day" }, { status: 400 });
    }

    const slots: string[] = [];
    let current = parse(configurations.startTime, "HH:mm", date);
    const end = parse(configurations.endTime, "HH:mm", date);

    //Percorer faixa e listar horários
    while (current < end) {
      if (
        !(
          configurations.lunchBreakEnabled &&
          configurations.lunchStartTime &&
          configurations.lunchEndTime &&
          isWithinInterval(current, {
            start: parse(configurations.lunchStartTime, "HH:mm", date),
            end: parse(configurations.lunchEndTime, "HH:mm", date)
          })
        )
      ) {
        slots.push(format(current, "HH:mm"));
      }
    current = addMinutes(current, configurations.appointmentDuration);
    }

    //Define inicio e fim do dia
    const startDay = new Date(date);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(date);
    endDay.setHours(23, 59, 59, 999);

    //Pega os agendamentos existentes e dps usa-os pra filtrar os horarios do dia
    const busyAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startDay,
          lte: endDay,
        },
        status: { not: "CANCELLED" },
      },
      select: { startTime: true },
    });
    const busyTimes = busyAppointments.map((a) => a.startTime);
    const availableTimes = slots.filter((slot) => !busyTimes.includes(slot));

    return NextResponse.json(availableTimes, { status: 200 });
  } catch (err) {
    console.error(`ERROR in GET/business-hours/available-slots: ${err}`);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}