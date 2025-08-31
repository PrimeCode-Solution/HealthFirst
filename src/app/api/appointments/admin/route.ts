import { NextRequest, NextResponse } from "next/server"
import {
  PrismaClient,
  Prisma,
  AppointmentStatus,
  UserRole,
} from "../../../../generated/prisma" // ajuste se precisar

const prisma = new PrismaClient()

// auth básica (trocar por next-auth/clerk/etc)
async function getAuthUser(req: NextRequest): Promise<{ id: string } | null> {
  const id = req.headers.get("x-user-id") // placeholder
  return id ? { id } : null
}

// checa admin
async function ensureAdmin(userId: string) {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (!me || me.role !== UserRole.ADMIN) return false
  return true
}

// GET /api/appointments (admin)
export async function GET(req: NextRequest) {
  try {
    // auth
    const user = await getAuthUser(req)
    if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    const isAdmin = await ensureAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 })

    // query params
    const url = new URL(req.url)
    const status = url.searchParams.get("status") ?? undefined
    const dateStart = url.searchParams.get("dateStart") ?? undefined
    const dateEnd = url.searchParams.get("dateEnd") ?? undefined
    const userId = url.searchParams.get("userId") ?? undefined
    const q = url.searchParams.get("q") ?? undefined
    const page = url.searchParams.get("page") ?? "1"
    const pageSize = url.searchParams.get("pageSize") ?? "20"

    // paginação
    const p = Math.max(parseInt(page, 10) || 1, 1)
    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100)
    const skip = (p - 1) * ps
    const take = ps

    // filtros
    const where: Prisma.AppointmentWhereInput = {}

    if (status) {
      const allowed = Object.values(AppointmentStatus) as string[]
      if (!allowed.includes(status)) {
        return NextResponse.json({ error: "invalid_status", allowed }, { status: 400 })
      }
      where.status = status as AppointmentStatus
    }

    if (userId) where.userId = userId

    if (dateStart || dateEnd) {
      const ds = dateStart ? new Date(dateStart) : undefined
      const de = dateEnd ? new Date(dateEnd) : undefined
      if ((ds && isNaN(ds.getTime())) || (de && isNaN(de.getTime()))) {
        return NextResponse.json({ error: "invalid_date_range" }, { status: 400 })
      }
      where.date = {}
      if (ds) where.date.gte = ds
      if (de) where.date.lte = de
    }

    if (q && q.trim()) {
      where.patientName = { contains: q.trim(), mode: "insensitive" }
    }

    // busca
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
    ])

    const pageCount = Math.ceil(total / ps)

    return NextResponse.json({
      meta: { total, page: p, pageSize: ps, pageCount },
      filters: { status, dateStart, dateEnd, userId, q },
      items,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
