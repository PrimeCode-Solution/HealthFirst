import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";

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
    const pendingTimeLimit = new Date(now.getTime() - 20 * 60 * 1000); 
    const cancelledTimeLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); 

    const pendingToDelete = await prisma.appointment.findMany({
      where: {
        status: "PENDING", 
        createdAt: { lt: pendingTimeLimit },
        OR: [
            { payment: { is: null } },
            { payment: { status: "PENDING" } },
            { payment: { status: "REJECTED" } }
        ]
      },
      include: { payment: true },
      take: 50, 
    });

    const cancelledToDelete = await prisma.appointment.findMany({
      where: {
        status: "CANCELLED",
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
            notes: "Cancelado automaticamente pelo sistema (falta de pagamento)",
            updatedBy: "SYSTEM",
            createdAt: new Date()
          }))
        });

        const pendingIds = pendingToDelete.map(a => a.id);
        
        await tx.appointment.updateMany({
            where: { id: { in: pendingIds } },
            data: { status: "CANCELLED" }
        });
        
        totalProcessed += pendingToDelete.length;
      }

      if (cancelledToDelete.length > 0) {
        const cancelledIds = cancelledToDelete.map(a => a.id);
        
        await tx.payment.deleteMany({
            where: { appointmentId: { in: cancelledIds } }
        });

        await tx.appointmentHistory.deleteMany({
            where: { originalId: { in: cancelledIds } } 
        });

        await tx.appointment.deleteMany({
            where: { id: { in: cancelledIds } }
        });
        
        totalProcessed += cancelledToDelete.length;
      }
    });

    return NextResponse.json({
      success: true,
      message: "Limpeza executada",
      processed_pending: pendingToDelete.length,
      processed_deleted: cancelledToDelete.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Erro crítico na limpeza:", error);
    return NextResponse.json(
      { error: "Internal Error", details: error.message }, 
      { status: 500 }
    );
  }
}