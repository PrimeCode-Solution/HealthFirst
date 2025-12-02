import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { startOfMonth, 
    subMonths, 
    format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);

    // Executa todas as queries em paralelo
    const [
      totalUsers,
      totalAppointments,
      revenueData,
      appointmentsByStatus,
      monthlyRevenueRaw
    ] = await Promise.all([
      // 1. Total de Pacientes (Role USER)
      prisma.user.count({
        where: { role: "USER" },
      }),

      // 2. Total de Consultas
      prisma.appointment.count(),

      // 3. Faturamento Total (Status APPROVED)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "APPROVED" },
      }),

      // 4. Consultas por Status (Para gráfico de Pizza/Donut)
      prisma.appointment.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // 5. Pagamentos dos últimos 6 meses (Para gráfico de barras/linha)
      prisma.payment.findMany({
        where: {
          status: "APPROVED",
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          createdAt: true,
          amount: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const revenueByMonthMap = new Map<string, number>();

    monthlyRevenueRaw.forEach((payment) => {
      // Formato: "jan/2025"
      const monthKey = format(payment.createdAt, "MMM/yyyy", { locale: ptBR });
      // Converter Decimal para Number
      const amount = Number(payment.amount);
      
      const currentTotal = revenueByMonthMap.get(monthKey) || 0;
      revenueByMonthMap.set(monthKey, currentTotal + amount);
    });

    const revenueChartData = Array.from(revenueByMonthMap.entries()).map(([month, total]) => ({
      month,
      revenue: total,
    }));

    // Formatar dados de status
    const statusChartData = appointmentsByStatus.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));

    return NextResponse.json({
      overview: {
        totalPatients: totalUsers,
        totalAppointments: totalAppointments,
        totalRevenue: Number(revenueData._sum.amount || 0),
      },
      charts: {
        revenueByMonth: revenueChartData,
        appointmentsByStatus: statusChartData,
      },
    });
  } catch (error) {
    console.error("Erro ao carregar stats do dashboard:", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar estatísticas" },
      { status: 500 }
    );
  }
}