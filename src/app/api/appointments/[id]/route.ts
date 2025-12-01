import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import {
  AppointmentStatus,
  ConsultationType,
  PaymentStatus,
} from "@/generated/prisma";
import {
  parseISO,
  isValid as isValidDate,
  startOfDay,
  endOfDay,
} from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

function toMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map(Number);
  return hh * 60 + mm;
}
function overlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart;
}
function isDayEnabled(bh: any, date: Date) {
  const wd = date.getDay();
  const map: Record<number, boolean> = {
    0: bh.sundayEnabled,
    1: bh.mondayEnabled,
    2: bh.tuesdayEnabled,
    3: bh.wednesdayEnabled,
    4: bh.thursdayEnabled,
    5: bh.fridayEnabled,
    6: bh.saturdayEnabled,
  };
  return !!map[wd];
}
async function getBusinessHoursOrThrow() {
  const bh = await prisma.businessHours.findFirst();
  if (!bh) throw new Error("BusinessHours não configurado");
  return bh;
}

async function validateSlotOr409(params: {
  dateIso: string;
  startTime: string;
  endTime: string;
  excludeAppointmentId?: string;
}) {
  const { dateIso, startTime, endTime, excludeAppointmentId } = params;

  const dateObj = parseISO(String(dateIso));
  if (!isValidDate(dateObj)) {
    return { error: { code: 400, msg: "data inválida (ISO)" } };
  }

  if (
    typeof startTime !== "string" ||
    typeof endTime !== "string" ||
    !/^\d{2}:\d{2}$/.test(startTime) ||
    !/^\d{2}:\d{2}$/.test(endTime)
  ) {
    return { error: { code: 400, msg: "startTime/endTime devem ser 'HH:MM'" } };
  }

  const startMin = toMinutes(startTime);
  const endMin = toMinutes(endTime);
  if (!(endMin > startMin)) {
    return { error: { code: 400, msg: "intervalo de horário inválido" } };
  }

  const bh = await getBusinessHoursOrThrow();
  if (!isDayEnabled(bh, dateObj)) {
    return {
      error: { code: 409, msg: "dia indisponível segundo BusinessHours" },
    };
  }

  const bhStart = toMinutes(bh.startTime);
  const bhEnd = toMinutes(bh.endTime);
  if (startMin < bhStart || endMin > bhEnd) {
    return { error: { code: 409, msg: "fora do horário de funcionamento" } };
  }

  if (bh.lunchBreakEnabled && bh.lunchStartTime && bh.lunchEndTime) {
    const lStart = toMinutes(bh.lunchStartTime);
    const lEnd = toMinutes(bh.lunchEndTime);
    if (overlap(startMin, endMin, lStart, lEnd)) {
      return {
        error: { code: 409, msg: "intervalo colide com horário de almoço" },
      };
    }
  }

  const expected = bh.appointmentDuration ?? 30;
  if (endMin - startMin !== expected) {
    return {
      error: { code: 400, msg: "duration_mismatch", expectedMin: expected },
    };
  }

  const dayStart = startOfDay(dateObj);
  const dayEnd = endOfDay(dateObj);

  const dayAppointments = await prisma.appointment.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      status: {
        in: [
          AppointmentStatus.PENDING,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.COMPLETED,
        ],
      },
      ...(excludeAppointmentId ? { NOT: { id: excludeAppointmentId } } : {}),
    },
    select: { id: true, startTime: true, endTime: true },
  });

  const hasCollision = dayAppointments.some((a) =>
    overlap(startMin, endMin, toMinutes(a.startTime), toMinutes(a.endTime)),
  );
  if (hasCollision) return { error: { code: 409, msg: "time_unavailable" } };

  return { ok: true };
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;

    const current = await prisma.appointment.findUnique({ where: { id } });
    if (!current)
      return NextResponse.json({ error: "not_found" }, { status: 404 });

    if (current.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }


    const isOwner = current.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const isAssignedDoctor = current.doctorId === session.user.id;

    if (!isAdmin && !isAssignedDoctor && !isOwner) {
       // Se for um médico tentando mexer na consulta de outro médico:
       if (session.user.role === 'DOCTOR') {
          return NextResponse.json({ error: "Forbidden: Not assigned doctor" }, { status: 403 });
       }
       // Outros casos
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}) as any);

    const {
      date,
      startTime,
      endTime,
      type,
      status,
      patientName,
      patientEmail,
      patientPhone,
      notes,
    } = body ?? {};

    if (current.status === AppointmentStatus.CANCELLED) {
      return NextResponse.json({ error: "already_cancelled" }, { status: 400 });
    }

    const newDateIso: string = date ? String(date) : current.date.toISOString();
    const parsed = parseISO(newDateIso);
    if (!isValidDate(parsed)) {
      return NextResponse.json(
        { error: "data inválida (ISO)" },
        { status: 400 },
      );
    }

    const newStart: string = startTime ?? current.startTime;
    const newEnd: string = endTime ?? current.endTime;

    if (date || startTime || endTime) {
      const check = await validateSlotOr409({
        dateIso: newDateIso,
        startTime: newStart,
        endTime: newEnd,
        excludeAppointmentId: id,
      });
      if ("error" in check) {
        const { code, msg, expectedMin } = check.error as any;
        return NextResponse.json(
          expectedMin ? { error: msg, expectedMin } : { error: msg },
          { status: code },
        );
      }
    }

    let newType: ConsultationType | undefined;
    if (typeof type === "string") {
      const allowed = Object.values(ConsultationType);
      if (!allowed.includes(type as ConsultationType)) {
        return NextResponse.json(
          { error: "invalid_type", allowed },
          { status: 400 },
        );
      }
      newType = type as ConsultationType;
    }

    let newStatus: AppointmentStatus | undefined;
    if (typeof status === "string") {
      const allowed = Object.values(AppointmentStatus);
      if (!allowed.includes(status as AppointmentStatus)) {
        return NextResponse.json(
          { error: "invalid_status", allowed },
          { status: 400 },
        );
      }
      newStatus = status as AppointmentStatus;
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        date: parsed,
        startTime: newStart,
        endTime: newEnd,
        type: newType ?? current.type,
        status: newStatus ?? current.status,
        patientName: patientName ?? current.patientName,
        patientEmail: patientEmail ?? current.patientEmail,
        patientPhone: patientPhone ?? current.patientPhone,
        notes: notes ?? current.notes,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    if (String((e as any)?.message || "").includes("BusinessHours")) {
      return NextResponse.json(
        { error: "business_hours_unavailable" },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;

    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!appt)
      return NextResponse.json({ error: "not_found" }, { status: 404 });

    if (appt.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (appt.status === AppointmentStatus.CANCELLED) {
      return new NextResponse(null, { status: 204 });
    }

    await prisma.$transaction(async (tx) => {
      if (appt.payment) {
        await tx.payment.update({
          where: { id: appt.payment.id },
          data: { status: PaymentStatus.CANCELLED },
        });
      }
      await tx.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CANCELLED },
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}