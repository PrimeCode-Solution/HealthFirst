import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { AppointmentStatus } from "@/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const { userId } = params;

    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const dateStart = url.searchParams.get("dateStart") ?? undefined;
    const dateEnd = url.searchParams.get("dateEnd") ?? undefined;
    const page = url.searchParams.get("page") ?? "1";
    const pageSize = url.searchParams.get("pageSize") ?? "20";

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const psRaw = parseInt(pageSize, 10) || 20;
    const ps = Math.min(Math.max(psRaw, 1), 100);
    const skip = (p - 1) * ps;
    const take = ps;

    const where: any = { userId };
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