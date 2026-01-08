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
  differenceInHours,
} from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { MercadoPagoConfig, PaymentRefund } from 'mercadopago';

const mpClient = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '' 
});

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

    const current = await prisma.appointment.findUnique({ 
      where: { id },
      include: { payment: true } 
    });
    
    if (!current)
      return NextResponse.json({ error: "not_found" }, { status: 404 });

    const isOwner = current.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const isAssignedDoctor = current.doctorId === session.user.id;

    if (!isOwner && !isAdmin && !isAssignedDoctor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}) as any);
    const { status, ...rest } = body;

    let newStatus: AppointmentStatus | undefined;
    
    if (typeof status === "string") {
      const allowed = Object.values(AppointmentStatus);
      if (!allowed.includes(status as AppointmentStatus)) {
        return NextResponse.json(
          { error: "invalid_status", allowed },
          { status: 400 },
        );
      }

      if (status === AppointmentStatus.COMPLETED) {
        const dateObj = new Date(current.date);
        const [h, m] = current.startTime.split(':').map(Number);
        const appointmentDateTime = new Date(
          dateObj.getUTCFullYear(),
          dateObj.getUTCMonth(),
          dateObj.getUTCDate(),
          h,
          m
        );
        const hasPassed = new Date() > appointmentDateTime;

        if (!isAdmin && !isAssignedDoctor && !(isOwner && hasPassed)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      newStatus = status as AppointmentStatus;
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...rest,
        status: newStatus ?? current.status,
      },
    });
    if (newStatus === "COMPLETED" && current.status !== "COMPLETED") {
        await prisma.appointmentHistory.create({
            data: {
                originalId: current.id,
                userId: current.userId,
                doctorId: current.doctorId,
                date: current.date,
                status: "COMPLETED",
                reason: "FINISHED_CONSULTATION", 
                amount: current.payment?.amount || 0
            }
        });
    }

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
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
      include: { payment: true }
    });

    if (!appt) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    const isOwner = appt.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const isAssignedDoctor = appt.doctorId === session.user.id;

    if (!isOwner && !isAdmin && !isAssignedDoctor) {
      return NextResponse.json({ error: "Permissão negada." }, { status: 403 });
    }

    const apptDate = new Date(appt.date);
    const [h, m] = appt.startTime.split(':').map(Number);
    const appointmentDateTime = new Date(
      apptDate.getUTCFullYear(),
      apptDate.getUTCMonth(),
      apptDate.getUTCDate(),
      h, 
      m
    );

    const now = new Date();
    const hoursUntilAppointment = differenceInHours(appointmentDateTime, now);
    const isLateCancellation = hoursUntilAppointment < 24;

    if (isLateCancellation && !isAdmin && isOwner) {
      const existingRequest = await prisma.cancellationRequest.findUnique({
        where: { appointmentId: id }
      });

      if (existingRequest) {
        return NextResponse.json({ error: "Já existe uma solicitação pendente." }, { status: 409 });
      }

      await prisma.$transaction([
        prisma.appointment.update({
          where: { id },
          data: { status: "CANCELLATION_REQUESTED" } 
        }),
        prisma.cancellationRequest.create({
          data: {
            appointmentId: id,
            reason: "Cancelamento com menos de 24h de antecedência",
            status: "PENDING"
          }
        })
      ]);

      return NextResponse.json({ 
        message: "Solicitação enviada para análise.",
        status: "REVIEW_REQUIRED"
      }, { status: 200 });
    }


    let refundStatus = "NOT_APPLICABLE";
    
    if (appt.payment && 
        appt.payment.mercadoPagoId && 
        (appt.payment.status === "APPROVED" || appt.payment.status === "CONFIRMED")) {
      
      try {
        const refundClient = new PaymentRefund(mpClient);
        await refundClient.create({ payment_id: appt.payment.mercadoPagoId });
        refundStatus = "SUCCESS";
      } catch (mpError) {
        console.error("Erro MP:", mpError);
        refundStatus = "FAILED";
        return NextResponse.json({ error: "Falha ao processar estorno." }, { status: 500 });
      }
    }

    let reason = "MANUAL_UNKNOWN";
    if (isAdmin) reason = "MANUAL_ADMIN";
    else if (isAssignedDoctor) reason = "MANUAL_DOCTOR";
    else if (isOwner) reason = "MANUAL_PATIENT";

    await prisma.$transaction([
        prisma.appointmentHistory.create({
            data: {
                originalId: appt.id,
                userId: appt.userId,
                doctorId: appt.doctorId,
                date: appt.date,
                status: "CANCELLED",
                reason: `${reason}_REFUND_${refundStatus}`,
                amount: appt.payment?.amount || 0
            }
        }),
        prisma.appointment.update({
            where: { id },
            data: { status: "CANCELLED" }
        })
    ]);

    return NextResponse.json({ 
      message: "Agendamento cancelado com sucesso.",
      refunded: refundStatus === "SUCCESS"
    }, { status: 200 });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}