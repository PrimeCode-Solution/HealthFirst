// app/api/appointments/user/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  Prisma,
  AppointmentStatus,
  UserRole,
} from "../../../../../generated/prisma";

const prisma = new PrismaClient();

// auth básica (trocar por next-auth/clerk/etc)
async function getAuthUser(req: NextRequest): Promise<{ id: string } | null> {
  const id = req.headers.get("x-user-id");
  return id ? { id } : null;
}

// checa acesso: admin ou o próprio user
async function canReadUserAppointments(meId: string, targetUserId: string) {
  if (meId === targetUserId) return true;
  const me = await prisma.user.findUnique({
    where: { id: meId },
    select: { role: true },
  });
  return me?.role === UserRole.ADMIN;
}

// GET /api/appointments/user/:userId
export async function GET(
  req: NextRequest,
  ctx: { params: { userId: string } },
) {
  try {
    // auth
    const user = await getAuthUser(req);
    if (!user?.id)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // permissão
    const { userId } = ctx.params;
    const allowed = await canReadUserAppointments(user.id, userId);
    if (!allowed)
      return NextResponse.json({ error: "forbidden" }, { status: 403 });

    // query
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const dateStart = url.searchParams.get("dateStart") ?? undefined;
    const dateEnd = url.searchParams.get("dateEnd") ?? undefined;
    const page = url.searchParams.get("page") ?? "1";
    const pageSize = url.searchParams.get("pageSize") ?? "20";

    // paginação
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const psRaw = parseInt(pageSize, 10) || 20;
    const ps = Math.min(Math.max(psRaw, 1), 100);
    const skip = (p - 1) * ps;
    const take = ps;

    // filtros
    const where: Prisma.AppointmentWhereInput = { userId };
    if (status) {
      const allowedStatuses = Object.values(AppointmentStatus) as string[];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: "invalid_status", allowed: allowedStatuses },
          { status: 400 },
        );
      }
      where.status = status as AppointmentStatus;
    }
    if (dateStart || dateEnd) {
      const ds = dateStart ? new Date(dateStart) : undefined;
      const de = dateEnd ? new Date(dateEnd) : undefined;
      if ((ds && isNaN(ds.getTime())) || (de && isNaN(de.getTime()))) {
        return NextResponse.json(
          { error: "invalid_date_range" },
          { status: 400 },
        );
      }
      where.date = {};
      if (ds) where.date.gte = ds;
      if (de) where.date.lte = de;
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
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              currency: true,
              preferenceId: true,
              paidAt: true,
            },
          },
        },
      }),
    ]);

    // resposta
    const pageCount = Math.ceil(total / ps);
    return NextResponse.json({
      meta: { total, page: p, pageSize: ps, pageCount },
      items,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
