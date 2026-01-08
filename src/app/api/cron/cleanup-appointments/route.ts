import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { AppointmentStatus, PaymentStatus } from "@/generated/prisma"; 

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing Cron Secret" },
      { status: 401 }
    );
  }

  try {
    const now = new Date();
    
    const pendingTimeLimit = new Date(now.getTime() - 60 * 60 * 1000); 
    
    const cancelledTimeLimit = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); 

    const pendingToDelete = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.PENDING, 
        createdAt: { lt: pendingTimeLimit },
        payment: { status: PaymentStatus.PENDING }
      },
      include: { payment: true },
      take: 50, 
    });

    const cancelledToDelete = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CANCELLED,
        updatedAt: { lt: cancelledTimeLimit } 
      },
      select: { id: true },
      take: 50
    });

    let totalProcessed = 0;

    await prisma.$transaction(async (tx) => {
      
      if (pendingToDelete.length > 0) {
        await tx.appointmentHistory.createMany({
          data: pendingToDelete.map(app => ({
            originalId: app.id,
            userId: app.userId,
            doctorId: app.doctorId,
            date: app.date,
            status: "CANCELLED",
            reason: "TIMEOUT_PAYMENT", 
            amount: app.payment?.amount || 0
          }))
        });

        const pendingIds = pendingToDelete.map(a => a.id);
        await tx.appointment.deleteMany({
          where: { id: { in: pendingIds } }
        });
        
        totalProcessed += pendingToDelete.length;
      }

      if (cancelledToDelete.length > 0) {
        const cancelledIds = cancelledToDelete.map(a => a.id);
        await tx.appointment.deleteMany({
            where: { id: { in: cancelledIds } }
        });
        
        totalProcessed += cancelledToDelete.length;
      }
    });

    return NextResponse.json({
      success: true,
      message: "Limpeza executada com segurança",
      processed_pending: pendingToDelete.length,
      processed_cancelled: cancelledToDelete.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Erro crítico na limpeza (Cron):", error);
    return NextResponse.json(
      { error: "Internal Error", details: error.message }, 
      { status: 500 }
    );
  }
}