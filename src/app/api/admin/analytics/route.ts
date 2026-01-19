import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { startOfDay, endOfDay, parseISO, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const REASON_MAP: Record<string, string> = {
  "TIMEOUT_PAYMENT": "Pagamento Expirado",
  "MANUAL_ADMIN": "Cancelado pelo Admin",
  "MANUAL_DOCTOR": "Cancelado pelo Médico",
  "MANUAL_PATIENT": "Cancelado pelo Paciente",
  "CANCELLATION_REQUESTED": "Solicitação em Análise",
  "MANUAL_ADMIN_REFUND_SUCCESS": "Admin (Reembolso Efetuado)",
  "REQUEST_REVIEW_APPROVE": "Solicitação Aprovada",
  "REFUND_NOT_APPLICABLE": "Cancelado (Sem Reembolso)",
  "REQUEST_REVIEW_REJECT": "Solicitação Rejeitada",
  "REQUEST_REVIEW_APPROVE_REFUND_NOT_APPLICABLE": "Solicitação Aprovada (Sem Reembolso)",
  "USER_REQUEST": "Solicitado pelo Usuário",
  "SYSTEM_ERROR": "Erro no Sistema",
  "NO_SHOW": "Não Compareceu"
};

function formatReasonText(reason: string | null): string {
  if (!reason) return "Não especificado";
  if (REASON_MAP[reason]) return REASON_MAP[reason];
  return reason
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "DOCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const queryDoctorId = url.searchParams.get("doctorId");
    const dateStart = url.searchParams.get("dateStart");
    const dateEnd = url.searchParams.get("dateEnd");
    let targetDoctorId: string | undefined = undefined;

    if (session.user.role === "DOCTOR") {
      targetDoctorId = session.user.id;
    } else if (queryDoctorId && queryDoctorId !== "all") {
      targetDoctorId = queryDoctorId;
    }

    const dateFilter: any = {};
    if (dateStart) dateFilter.gte = startOfDay(parseISO(dateStart));
    if (dateEnd) dateFilter.lte = endOfDay(parseISO(dateEnd));

    const whereCommon = {
      ...(targetDoctorId ? { doctorId: targetDoctorId } : {}),
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
    };

    // --- A. DADOS FINANCEIROS GERAIS ---
    const revenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: { in: ["APPROVED", "CONFIRMED"] },
        appointment: whereCommon,
      }
    });

    const lostRevenue = await prisma.appointment.aggregate({
        _sum: { amount: true },
        where: { ...whereCommon, status: "CANCELLED" }
    });

    // --- B. TOTAL DE PACIENTES E AGENDAMENTOS ---
    let totalPatients = 0;
    if (targetDoctorId) {
        const uniquePatients = await prisma.appointment.findMany({
            where: { doctorId: targetDoctorId },
            distinct: ['userId'],
            select: { userId: true }
        });
        totalPatients = uniquePatients.length;
    } else {
        totalPatients = await prisma.user.count({ where: { role: "USER" } });
    }

    const totalAppointments = await prisma.appointment.count({ where: whereCommon });
    
    // --- C. MOTIVOS DE CANCELAMENTO ---
    const rawCancellationReasons = await prisma.appointmentHistory.groupBy({
        by: ['reason'],
        where: { ...whereCommon, status: "CANCELLED" },
        _count: { reason: true }
    });

    const cancellationReasons = rawCancellationReasons.map(item => ({
        name: formatReasonText(item.reason),
        value: item._count.reason
    }));

    // --- D. DADOS MENSAIS ---
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStart = startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
        const monthEnd = endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
        
        const monthlyRevenue = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                status: { in: ["APPROVED", "CONFIRMED"] },
                createdAt: { gte: monthStart, lte: monthEnd },
                ...(targetDoctorId ? { appointment: { doctorId: targetDoctorId } } : {})
            }
        });

        const monthlyLost = await prisma.appointment.aggregate({
            _sum: { amount: true },
            where: {
                status: "CANCELLED",
                updatedAt: { gte: monthStart, lte: monthEnd },
                ...(targetDoctorId ? { doctorId: targetDoctorId } : {})
            }
        });
        
        monthlyData.push({
            name: format(date, 'MMM', { locale: ptBR }),
            revenue: Number(monthlyRevenue._sum.amount || 0),
            lost: Number(monthlyLost._sum.amount || 0)
        });
    }

    // --- E. PERFORMANCE POR MÉDICO (ATUALIZADO COM CÁLCULO DE RECEITA) ---
    const appointmentsForStats = await prisma.appointment.findMany({
        where: whereCommon,
        select: { doctorId: true, status: true, amount: true }
    });

    const byDoctor: Record<string, any> = {};
    
    // Agora inicializamos revenueAmount (receita confirmada) também
    const initDoc = (id: string) => { 
        if (!byDoctor[id]) byDoctor[id] = { attended: 0, revenueAmount: 0, cancelledTotal: 0, lostAmount: 0 }; 
    }

    appointmentsForStats.forEach(app => {
        const docId = app.doctorId || "unknown";
        initDoc(docId);
        if (["CONFIRMED", "COMPLETED"].includes(app.status)) {
            byDoctor[docId].attended++;
            // Somamos o valor das consultas atendidas
            byDoctor[docId].revenueAmount += Number(app.amount || 0);
        } else if (app.status === "CANCELLED") {
            byDoctor[docId].cancelledTotal++;
            byDoctor[docId].lostAmount += Number(app.amount || 0);
        }
    });

    const doctorIds = Object.keys(byDoctor).filter(id => id !== "unknown");
    const doctorsDb = await prisma.user.findMany({
        where: { id: { in: doctorIds } },
        select: { id: true, name: true, email: true }
    });

    const doctorStats = doctorsDb.map(doc => ({
        id: doc.id,
        name: doc.name,
        email: doc.email,
        ...byDoctor[doc.id]
    }));

    return NextResponse.json({
      summary: {
        totalRevenue: Number(revenue._sum.amount || 0),
        lostRevenue: Number(lostRevenue._sum.amount || 0),
        totalPatients,
        totalAppointments,
      },
      charts: { cancellationReasons, monthlyData },
      doctors: doctorStats
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}