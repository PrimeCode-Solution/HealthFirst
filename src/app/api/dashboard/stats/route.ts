import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentStatus } from "@/generated/prisma";

export interface AppointmentBase {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  patientName: string;
  status: AppointmentStatus;
}

export interface FormattedAppointments extends AppointmentBase {
  formattedDate: string;
  formattedTime: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const userId = session.user.id;

    switch (role) {
      case "ADMIN":
        return NextResponse.json(await getAdminStats());
      case "DOCTOR":
        return NextResponse.json(await getDoctorStats(userId));
      case "USER":
        return NextResponse.json(await getUserStats(userId));
      default:
        return NextResponse.json(
          { error: "Role não suportada!" },
          { status: 403 }
        );
    }
  } catch (error) {
    console.error("Erro ao carregar stats do dashboard:", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar estatísticas" },
      { status: 500 }
    );
  }
}

async function getAdminStats() {
  const now = new Date();
  const sixMonthsAgo = subMonths(now, 6);

  const [totalUsers, totalAppointments, revenueData, appointmentsByStatus, monthlyRevenueRaw] =
    await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),

      prisma.appointment.count(),

      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "APPROVED" },
      }),

      prisma.appointment.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      prisma.payment.findMany({
        where: {
          status: "APPROVED",
          createdAt: { gte: sixMonthsAgo },
        },
        select: { createdAt: true, amount: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  const revenueMap = new Map<string, number>();
  monthlyRevenueRaw.forEach((p) => {
    const month = format(p.createdAt, "MMM/yyyy", { locale: ptBR });
    const value = Number(p.amount);
    revenueMap.set(month, (revenueMap.get(month) || 0) + value);
  });

  return {
    overview: {
      totalPatients: totalUsers,
      totalAppointments: totalAppointments,
      totalRevenue: Number(revenueData._sum.amount || 0),
    },
    charts: {
      revenueByMonth: Array.from(revenueMap.entries()).map(([month, revenue]) => ({
        month,
        revenue,
      })),
      appointmentsByStatus: appointmentsByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
    },
  };
}

async function getDoctorStats(doctorId: string) {
  const now = new Date();

  const [
    todaysAppointmentsRaw,
    totalPatientsAttended,
    cancelledAppointments,
    upcomingAppointmentsRaw,
    recentAppointmentsRaw,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId,
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        patientName: true,
        status: true,
      },
    }),

    prisma.appointment.count({
      where: { doctorId, status: "COMPLETED" },
    }),

    prisma.appointment.count({
      where: { doctorId, status: "CANCELLED" },
    }),

    prisma.appointment.findMany({
      where: {
        doctorId,
        date: { gte: now },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        patientName: true,
        status: true,
      },
    }),

    prisma.appointment.findMany({
      where: {
        doctorId,
        OR: [
          { date: { lt: now } },
          {
            AND: [
              { date: { equals: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } },
              { endTime: { lt: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}` } }
            ],
          },
        ],
      },
      orderBy: { date: "desc" },
      take: 5,
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        patientName: true,
        status: true,
      },
    }),
  ]);

  const normalize = (apt: AppointmentBase): FormattedAppointments => ({
    ...apt,
    formattedDate: format(apt.date, "dd/MM/yyyy", { locale: ptBR }),
    formattedTime: `${apt.startTime} - ${apt.endTime}`,
  });

  const todaysAppointments = todaysAppointmentsRaw.map(normalize);
  const upcomingAppointments = upcomingAppointmentsRaw.map(normalize);
  const recentAppointments = recentAppointmentsRaw.map(normalize);

  return {
    metrics: {
      todaysAppointments: todaysAppointments.length,
      totalPatientsAttended,
      cancelledAppointments,
    },
    upcomingAppointments,
    recentAppointments,
  };
}

async function getUserStats(userId: string) {
  const now = new Date();

  const [nextAppointmentRaw, historyRaw] = await Promise.all([
    prisma.appointment.findFirst({
      where: { userId, date: { gte: now } },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        patientName: true,
        status: true,
      },
    }),

    prisma.appointment.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 8,
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        patientName: true,
        status: true,
      },
    }),
  ]);

  const formatAppointment = (
    apt: AppointmentBase
  ): FormattedAppointments => ({
    ...apt,
    formattedDate: format(apt.date, "dd/MM/yyyy", { locale: ptBR }),
    formattedTime: `${apt.startTime} - ${apt.endTime}`,
  });

  const nextAppointment: FormattedAppointments | null =
    nextAppointmentRaw ? formatAppointment(nextAppointmentRaw) : null;
  const recentAppointments: FormattedAppointments[] =
    historyRaw.map(formatAppointment);
  const confirmedAppointmentsCount = historyRaw.filter(a => a.status === "CONFIRMED").length;
  const cancelledAppointmentsCount = historyRaw.filter(a => a.status === "CANCELLED").length;

  return {
    nextAppointment,
    confirmedAppointmentsCount,
    cancelledAppointmentsCount,
    recentAppointments,
  };
}