import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import {
  WEEKDAYS,
  normalizeTime,
  validateWeekSchedule,
  type DayScheduleInput,
} from "@/modules/business-hours/domain/weeklySchedule";

// Escala por dia da semana é a fonte da verdade; os campos globais de
// BusinessHours seguem sendo gravados para manter compatibilidade com leituras
// legadas (e servir de fallback quando um dia não tem registro próprio).
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    let targetUserId = session.user.id;

    const queryUserId = url.searchParams.get("doctorId");
    if (session.user.role === "ADMIN" && queryUserId) {
      targetUserId = queryUserId;
    }

    const configurations = await prisma.businessHours.findUnique({
      where: { doctorId: targetUserId },
      include: { days: { orderBy: { dayOfWeek: "asc" } } },
    });

    return NextResponse.json(configurations || {}, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

function parseDaysPayload(rawDays: unknown): DayScheduleInput[] | null {
  if (!Array.isArray(rawDays)) return null;

  return rawDays.map((day: any) => {
    const lunchBreakEnabled = Boolean(day?.lunchBreakEnabled);
    const duration =
      day?.appointmentDuration === null || day?.appointmentDuration === undefined
        ? null
        : Number(day.appointmentDuration);

    return {
      dayOfWeek: Number(day?.dayOfWeek),
      enabled: Boolean(day?.enabled),
      startTime: normalizeTime(day?.startTime) ?? "",
      endTime: normalizeTime(day?.endTime) ?? "",
      lunchBreakEnabled,
      lunchStartTime: lunchBreakEnabled ? normalizeTime(day?.lunchStartTime) : null,
      lunchEndTime: lunchBreakEnabled ? normalizeTime(day?.lunchEndTime) : null,
      appointmentDuration: duration !== null && Number.isFinite(duration) ? duration : null,
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    let targetUserId = session.user.id;

    if (session.user.role === "ADMIN" && body.doctorId) {
      targetUserId = body.doctorId;
    } else if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Limpeza e Validação dos dados
    const {
        id,
        doctorId,
        createdAt,
        updatedAt,
        appointmentDuration,
        days: rawDays,
        ...data
    } = body;

    const duration = Number(appointmentDuration);
    if (!Number.isFinite(duration) || duration < 5 || duration > 480) {
      return NextResponse.json(
        { error: "Duração da consulta deve ficar entre 5 e 480 minutos" },
        { status: 400 },
      );
    }

    const days = parseDaysPayload(rawDays);

    if (days) {
      const errors = validateWeekSchedule(
        days.map((day) => ({
          ...day,
          appointmentDuration: day.appointmentDuration ?? duration,
        })),
      );
      if (errors.length > 0) {
        return NextResponse.json({ error: errors[0], errors }, { status: 400 });
      }
    }

    // Os flags globais *Enabled acompanham a escala por dia para que consumidores
    // legados (que só leem BusinessHours) continuem enxergando os dias corretos.
    const legacyFlags: Record<string, boolean> = {};
    if (days) {
      for (const weekday of WEEKDAYS) {
        const match = days.find((d) => d.dayOfWeek === weekday.dayOfWeek);
        if (match) legacyFlags[weekday.legacyKey] = Boolean(match.enabled);
      }
    }

    // Primeiro dia habilitado vira o "padrão global" usado como fallback.
    const referenceDay = days?.find((d) => d.enabled) ?? days?.[0];
    const legacyTimes = referenceDay
      ? {
          startTime: referenceDay.startTime || data.startTime,
          endTime: referenceDay.endTime || data.endTime,
          lunchBreakEnabled: Boolean(referenceDay.lunchBreakEnabled),
          lunchStartTime: referenceDay.lunchStartTime ?? null,
          lunchEndTime: referenceDay.lunchEndTime ?? null,
        }
      : {};

    // Remove chaves undefined: no `create` do Prisma elas invalidariam os
    // campos obrigatórios startTime/endTime em vez de cair no default abaixo.
    const scalarData = Object.fromEntries(
      Object.entries({
        ...data,
        ...legacyFlags,
        ...legacyTimes,
        appointmentDuration: duration,
      }).filter(([, value]) => value !== undefined),
    );

    const updated = await prisma.$transaction(async (tx) => {
      const businessHours = await tx.businessHours.upsert({
        where: { doctorId: targetUserId },
        update: scalarData,
        create: {
          startTime: "08:00",
          endTime: "18:00",
          ...scalarData,
          doctorId: targetUserId,
        },
      });

      if (days) {
        // Substitui a semana inteira: o formulário sempre envia os 7 dias.
        await Promise.all(
          days.map((day) =>
            tx.businessHoursDay.upsert({
              where: {
                businessHoursId_dayOfWeek: {
                  businessHoursId: businessHours.id,
                  dayOfWeek: day.dayOfWeek,
                },
              },
              update: {
                enabled: day.enabled ?? false,
                startTime: day.startTime || businessHours.startTime,
                endTime: day.endTime || businessHours.endTime,
                lunchBreakEnabled: Boolean(day.lunchBreakEnabled),
                lunchStartTime: day.lunchStartTime ?? null,
                lunchEndTime: day.lunchEndTime ?? null,
                appointmentDuration: day.appointmentDuration ?? null,
              },
              create: {
                businessHoursId: businessHours.id,
                dayOfWeek: day.dayOfWeek,
                enabled: day.enabled ?? false,
                startTime: day.startTime || businessHours.startTime,
                endTime: day.endTime || businessHours.endTime,
                lunchBreakEnabled: Boolean(day.lunchBreakEnabled),
                lunchStartTime: day.lunchStartTime ?? null,
                lunchEndTime: day.lunchEndTime ?? null,
                appointmentDuration: day.appointmentDuration ?? null,
              },
            }),
          ),
        );
      }

      return tx.businessHours.findUnique({
        where: { id: businessHours.id },
        include: { days: { orderBy: { dayOfWeek: "asc" } } },
      });
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("Erro ao salvar BusinessHours:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
