import { NextRequest, NextResponse } from "next/server"
import {
  PrismaClient,
  AppointmentStatus,
  PaymentStatus,
  ConsultationType,
} from "../../../generated/prisma" 

const prisma = new PrismaClient()

// helpers de horário
function toMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map(Number)
  return hh * 60 + mm
}

// checa colisão
function overlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart
}

// (opcional)
function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  )
}
// checa se o dia está habilitado no BusinessHours
function isDayEnabled(bh: any, date: Date) {
  const wd = date.getUTCDay()
  const map: Record<number, boolean> = {
    0: bh.sundayEnabled,
    1: bh.mondayEnabled,
    2: bh.tuesdayEnabled,
    3: bh.wednesdayEnabled,
    4: bh.thursdayEnabled,
    5: bh.fridayEnabled,
    6: bh.saturdayEnabled,
  }
  return !!map[wd]
}
// busca BusinessHours ou lança
async function getBusinessHoursOrThrow() {
  const bh = await prisma.businessHours.findFirst()
  if (!bh) throw new Error("BusinessHours não configurado")
  return bh
}

// mock Mercado Pago (trocar por SDK/API real depois)
async function createMercadoPagoPreference(input: {
  appointmentId: string
  amount: number
  description: string
  successUrl?: string
  pendingUrl?: string
  failureUrl?: string
}) {
  return {
    mercadoPagoId: `mp_${input.appointmentId}`,
    preferenceId: `pref_${input.appointmentId}`,
    init_point: `https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref_${input.appointmentId}`,
  }
}

/* auth placeholder: trocar pelo clerk  */
async function getAuthUser(req: NextRequest): Promise<{ id: string } | null> {
  // exemplo: recuperar de header "x-user-id" (apenas placeholder)
  const headerId = req.headers.get("x-user-id")
  return headerId ? { id: headerId } : null
}

// ----------------- POST /api/appointments -----------------
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({} as any))
    const {
      // dados do agendamento
      date,
      startTime,
      endTime,
      type,
      patientName,
      patientEmail,
      patientPhone,
      notes,
      // pagamento
      amount,
      currency,
      description,
      successUrl,
      pendingUrl,
      failureUrl,
    } = body ?? {}

    // validação básica
    if (!date || !startTime || !endTime || !patientName) {
      return NextResponse.json(
        { error: "Campos obrigatórios: date, startTime, endTime, patientName" },
        { status: 400 }
      )
    }
    if (
      typeof startTime !== "string" ||
      typeof endTime !== "string" ||
      !startTime.includes(":") ||
      !endTime.includes(":")
    ) {
      return NextResponse.json(
        { error: "startTime/endTime devem ser strings 'HH:MM'" },
        { status: 400 }
      )
    }

    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: "data inválida" }, { status: 400 })
    }

    const startMin = toMinutes(startTime)
    const endMin = toMinutes(endTime)
    if (!(endMin > startMin)) {
      return NextResponse.json({ error: "intervalo de horário inválido" }, { status: 400 })
    }

    // BusinessHours
    const bh = await getBusinessHoursOrThrow()
    if (!isDayEnabled(bh, dateObj)) {
      return NextResponse.json(
        { error: "dia indisponível segundo BusinessHours" },
        { status: 409 }
      )
    }

    const bhStart = toMinutes(bh.startTime)
    const bhEnd = toMinutes(bh.endTime)
    if (startMin < bhStart || endMin > bhEnd) {
      return NextResponse.json({ error: "fora do horário de funcionamento" }, { status: 409 })
    }

    if (bh.lunchBreakEnabled && bh.lunchStartTime && bh.lunchEndTime) {
      const lStart = toMinutes(bh.lunchStartTime)
      const lEnd = toMinutes(bh.lunchEndTime)
      if (overlap(startMin, endMin, lStart, lEnd)) {
        return NextResponse.json(
          { error: "intervalo colide com horário de almoço" },
          { status: 409 }
        )
      }
    }

    const expected = bh.appointmentDuration ?? 30
    if (endMin - startMin !== expected) {
      return NextResponse.json(
        { error: "duration_mismatch", expectedMin: expected },
        { status: 400 }
      )
    }

    // disponibilidade do dia
    const sameDayStart = new Date(
      Date.UTC(
        dateObj.getUTCFullYear(),
        dateObj.getUTCMonth(),
        dateObj.getUTCDate(),
        0,
        0,
        0
      )
    )
    const sameDayEnd = new Date(
      Date.UTC(
        dateObj.getUTCFullYear(),
        dateObj.getUTCMonth(),
        dateObj.getUTCDate(),
        23,
        59,
        59
      )
    )

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
      select: { id: true, startTime: true, endTime: true },
    })

    const hasCollision = dayAppointments.some((a) =>
      overlap(startMin, endMin, toMinutes(a.startTime), toMinutes(a.endTime))
    )
    if (hasCollision) {
      return NextResponse.json({ error: "time_unavailable" }, { status: 409 })
    }

    // tipo de consulta
    let typeValue: ConsultationType = ConsultationType.GENERAL
    if (typeof type === "string") {
      const allowed = Object.values(ConsultationType)
      if (allowed.includes(type as ConsultationType)) {
        typeValue = type as ConsultationType
      }
    }

    // cria appointment (PENDING)
    const appointment = await prisma.appointment.create({
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
    })

    // amount pode vir string → normaliza
    const normalizedAmount =
      typeof amount === "number"
        ? amount
        : typeof amount === "string"
        ? Number(amount)
        : NaN

    if (!Number.isFinite(normalizedAmount) || !description) {
      return NextResponse.json(
        { error: "amount (número) e description são obrigatórios para o pagamento" },
        { status: 400 }
      )
    }

    // cria preferência (mock) e payment (PENDING)
    const pref = await createMercadoPagoPreference({
      appointmentId: appointment.id,
      amount: normalizedAmount,
      description,
      successUrl,
      pendingUrl,
      failureUrl,
    })

    const payment = await prisma.payment.create({
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
    })

    // resposta
    return NextResponse.json(
      {
        appointment,
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          preferenceId: payment.preferenceId,
          init_point: pref.init_point, // trocar por real quando integrar o MP
        },
      },
      { status: 201 }
    )
  } catch (e: any) {
    console.error(e)
    if (String(e?.message || "").includes("BusinessHours")) {
      return NextResponse.json({ error: "BusinessHours não configurado" }, { status: 500 })
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
