import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  AppointmentStatus,
  PaymentStatus,
  ConsultationType,
} from "../../../generated/prisma";
import { z } from "zod";
import { parseISO, isValid as isValidDate } from "date-fns";

const prisma = new PrismaClient();

/* ---------------------- helpers de horário ---------------------- */
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

/* ----------------- mock Mercado Pago (trocar depois) ----------------- */
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

/* ------------------- auth placeholder (trocar pelo Clerk) ------------------- */
async function getAuthUser(req: NextRequest): Promise<{ id: string } | null> {
  const headerId = req.headers.get("x-user-id");
  return headerId ? { id: headerId } : null;
}

/* --------------------------- validação (Zod) --------------------------- */
const bodySchema = z.object({
  // data ISO (ex.: "2025-09-04" ou "2025-09-04T00:00:00Z")
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

/* ===================== POST /api/appointments ===================== */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

    const dateObj = parseISO(date); // garantido válido
    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);
    if (!(endMin > startMin)) {
      return NextResponse.json(
        { error: "intervalo de horário inválido" },
        { status: 400 },
      );
    }

    // Regras de funcionamento
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

    // Disponibilidade do dia (UTC 00:00–23:59:59)
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

    // Tipo de consulta
    let typeValue: ConsultationType = ConsultationType.GENERAL;
    if (typeof type === "string") {
      const allowed = Object.values(ConsultationType);
      if (allowed.includes(type as ConsultationType)) {
        typeValue = type as ConsultationType;
      }
    }

    // amount -> número
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

    // Transação: cria Appointment (PENDING) + Payment (PENDING)
    const { appointment, payment, pref } = await prisma.$transaction(
      async (tx) => {
        const appointment = await tx.appointment.create({
          data: {
            userId: user.id,
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
    // conflito de chave única (se você adicionar @@unique em [date, startTime], por ex.)
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "time_unavailable" }, { status: 409 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
