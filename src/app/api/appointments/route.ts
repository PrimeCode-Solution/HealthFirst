import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import {
  AppointmentStatus,
  PaymentStatus,
  ConsultationType,
} from "@/generated/prisma";
import { z } from "zod";
import {
  parseISO,
  isValid as isValidDate,
  startOfDay,
  endOfDay,
} from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

const querySchema = z.object({
  status: z
    .string()
    .optional()
    .refine(
      (v) => !v || (Object.values(AppointmentStatus) as string[]).includes(v),
      "invalid_status",
    ),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  userId: z.string().optional(),
  q: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((v) => Math.max(parseInt(v ?? "1", 10) || 1, 1)),
  pageSize: z
    .string()
    .optional()
    .transform((v) => {
      const n = Math.max(parseInt(v ?? "20", 10) || 20, 1);
      return Math.min(n, 100);
    }),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const parsed = querySchema.safeParse(
      Object.fromEntries(url.searchParams.entries()),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation", issues: parsed.error.issues },
        { status: 422 },
      );
    }

    const { status, dateStart, dateEnd, userId, q, page, pageSize } =
      parsed.data;

    const where: any = {};

    if (status) where.status = status as AppointmentStatus;

    if (session.user.role === "ADMIN" || session.user.role === "DOCTOR") {
      if (userId) where.userId = userId;
    } else {
      where.userId = session.user.id;
    }

    if (dateStart || dateEnd) {
      const ds = dateStart ? parseISO(dateStart) : undefined;
      const de = dateEnd ? parseISO(dateEnd) : undefined;

      if ((ds && !isValidDate(ds)) || (de && !isValidDate(de))) {
        return NextResponse.json(
          { error: "invalid_date_range" },
          { status: 400 },
        );
      }

      where.date = {};
      if (ds) where.date.gte = startOfDay(ds);
      if (de) where.date.lte = endOfDay(de);
    }

    if (q && q.trim()) {
      where.patientName = { contains: q.trim(), mode: "insensitive" };
    }

    const skip = (page! - 1) * pageSize!;
    const take = pageSize!;

    const [total, items] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        orderBy: [{ date: "desc" }, { startTime: "asc" }],
        skip,
        take,
        select: {
          id: true,
          status: true,
          date: true,
          startTime: true,
          endTime: true,
          type: true,
          patientName: true,
          patientEmail: true,
          patientPhone: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: { select: { id: true, name: true, email: true } },
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              currency: true,
              preferenceId: true,
              mercadoPagoId: true,
              paidAt: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      meta: {
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize!),
      },
      filters: { status, dateStart, dateEnd, userId: where.userId, q },
      items,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

function toMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map(Number);
  return hh * 60 + mm;
}

function overlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart;
}

function isDayEnabled(bh: any, date: Date) {
  const wd = date.getUTCDay();
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

async function createMercadoPagoPreference(input: {
  appointmentId: string;
  amount: number;
  description: string;
  successUrl?: string;
  pendingUrl?: string;
  failureUrl?: string;
}) {
  return {
    mercadoPagoId: `mp_${input.appointmentId}`,
    preferenceId: `pref_${input.appointmentId}`,
    init_point: `https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref_${input.appointmentId}`,
  };
}

const bodySchema = z.object({
  date: z
    .string()
    .refine((v) => isValidDate(parseISO(v)), "data inválida (use ISO string)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime deve ser HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "endTime deve ser HH:MM"),

  type: z.string().optional(),

  patientName: z.string().min(1),
  patientEmail: z
    .string()
    .email()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  patientPhone: z.string().optional(),
  notes: z.string().optional(),

  amount: z.union([z.number(), z.string()]),
  currency: z.string().default("BRL"),
  description: z.string().min(1),

  successUrl: z.string().url().optional(),
  pendingUrl: z.string().url().optional(),
  failureUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation", issues: parsed.error.issues },
        { status: 422 },
      );
    }

    const {
      date,
      startTime,
      endTime,
      type,
      patientName,
      patientEmail,
      patientPhone,
      notes,
      amount,
      currency,
      description,
      successUrl,
      pendingUrl,
      failureUrl,
    } = parsed.data;

    const dateObj = parseISO(date);
    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);
    if (!(endMin > startMin)) {
      return NextResponse.json(
        { error: "intervalo de horário inválido" },
        { status: 400 },
      );
    }

    const bh = await getBusinessHoursOrThrow();
    if (!isDayEnabled(bh, dateObj)) {
      return NextResponse.json(
        { error: "dia indisponível segundo BusinessHours" },
        { status: 409 },
      );
    }
    const bhStart = toMinutes(bh.startTime);
    const bhEnd = toMinutes(bh.endTime);
    if (startMin < bhStart || endMin > bhEnd) {
      return NextResponse.json(
        { error: "fora do horário de funcionamento" },
        { status: 409 },
      );
    }
    if (bh.lunchBreakEnabled && bh.lunchStartTime && bh.lunchEndTime) {
      const lStart = toMinutes(bh.lunchStartTime);
      const lEnd = toMinutes(bh.lunchEndTime);
      if (overlap(startMin, endMin, lStart, lEnd)) {
        return NextResponse.json(
          { error: "intervalo colide com horário de almoço" },
          { status: 409 },
        );
      }
    }
    const expected = bh.appointmentDuration ?? 30;
    if (endMin - startMin !== expected) {
      return NextResponse.json(
        { error: "duration_mismatch", expectedMin: expected },
        { status: 400 },
      );
    }

    const sameDayStart = new Date(
      Date.UTC(
        dateObj.getUTCFullYear(),
        dateObj.getUTCMonth(),
        dateObj.getUTCDate(),
        0,
        0,
        0,
      ),
    );
    const sameDayEnd = new Date(
      Date.UTC(
        dateObj.getUTCFullYear(),
        dateObj.getUTCMonth(),
        dateObj.getUTCDate(),
        23,
        59,
        59,
      ),
    );

    const dayAppointments = await prisma.appointment.findMany({
      where: {
        date: { gte: sameDayStart, lte: sameDayEnd },
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.COMPLETED,
          ],
        },
      },
      select: { startTime: true, endTime: true },
    });
    const hasCollision = dayAppointments.some((a) =>
      overlap(startMin, endMin, toMinutes(a.startTime), toMinutes(a.endTime)),
    );
    if (hasCollision) {
      return NextResponse.json({ error: "time_unavailable" }, { status: 409 });
    }

    let typeValue: ConsultationType = ConsultationType.GENERAL;
    if (typeof type === "string") {
      const allowed = Object.values(ConsultationType);
      if (allowed.includes(type as ConsultationType)) {
        typeValue = type as ConsultationType;
      }
    }

    const normalizedAmount =
      typeof amount === "number"
        ? amount
        : typeof amount === "string"
          ? Number(amount)
          : NaN;
    if (!Number.isFinite(normalizedAmount)) {
      return NextResponse.json(
        { error: "amount inválido (use número ou string numérica)" },
        { status: 400 },
      );
    }

    const { appointment, payment, pref } = await prisma.$transaction(
      async (tx) => {
        const appointment = await tx.appointment.create({
          data: {
            userId: session.user.id,
            date: dateObj,
            startTime,
            endTime,
            type: typeValue,
            status: AppointmentStatus.PENDING,
            patientName,
            patientEmail,
            patientPhone,
            notes,
          },
        });

        const pref = await createMercadoPagoPreference({
          appointmentId: appointment.id,
          amount: normalizedAmount,
          description,
          successUrl,
          pendingUrl,
          failureUrl,
        });

        const payment = await tx.payment.create({
          data: {
            appointmentId: appointment.id,
            amount: normalizedAmount,
            currency: currency ?? "BRL",
            description,
            status: PaymentStatus.PENDING,
            mercadoPagoId: pref.mercadoPagoId,
            preferenceId: pref.preferenceId,
            payerEmail: patientEmail ?? null,
            payerName: patientName ?? null,
            payerPhone: patientPhone ?? null,
            successUrl: successUrl ?? null,
            pendingUrl: pendingUrl ?? null,
            failureUrl: failureUrl ?? null,
          },
        });

        return { appointment, payment, pref };
      },
    );

    return NextResponse.json(
      {
        appointment,
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          preferenceId: payment.preferenceId,
          init_point: (pref as any).init_point,
        },
      },
      { status: 201 },
    );
  } catch (e: any) {
    console.error(e);
    if (String(e?.message || "").includes("BusinessHours")) {
      return NextResponse.json(
        { error: "BusinessHours não configurado" },
        { status: 500 },
      );
    }
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "time_unavailable" }, { status: 409 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}