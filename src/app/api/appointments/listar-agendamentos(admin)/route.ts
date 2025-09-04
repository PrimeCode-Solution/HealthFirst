// app/api/appointments/route.ts  (ou .../appointments/list/route.ts se preferir separar)
import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  Prisma,
  AppointmentStatus,
} from "../../../../generated/prisma";
import { z } from "zod";
import {
  parseISO,
  isValid as isValidDate,
  startOfDay,
  endOfDay,
} from "date-fns";

const prisma = new PrismaClient();

/** ----- schema dos filtros (querystring) ----- */
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

    // ----- monta where -----
    const where: Prisma.AppointmentWhereInput = {};

    if (status) where.status = status as AppointmentStatus;
    if (userId) where.userId = userId;

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

    // ----- consulta + total -----
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
      filters: { status, dateStart, dateEnd, userId, q },
      items,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
