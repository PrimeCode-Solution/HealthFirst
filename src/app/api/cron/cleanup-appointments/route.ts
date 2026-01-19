import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    await prisma.$transaction(async (tx) => {
      if (pendingToDelete.length > 0) {
        await tx.appointmentHistory.createMany({
          data: pendingToDelete.map(app => ({
            appointmentId: app.id, 
            userId: app.userId,    
            doctorId: app.doctorId, 
            date: app.date,        
            status: "CANCELLED",
            reason: "TIMEOUT_PAYMENT",
          }))
        });

        const pendingIds = pendingToDelete.map(a => a.id);
        await tx.appointment.updateMany({
            where: { id: { in: pendingIds } },
            data: { status: "CANCELLED" }
        });
      }

      if (cancelledToDelete.length > 0) {
        const cancelledIds = cancelledToDelete.map(a => a.id);
        

        try {
            await tx.payment.deleteMany({ where: { appointmentId: { in: cancelledIds } } });
            await tx.appointmentHistory.deleteMany({ where: { appointmentId: { in: cancelledIds } } });
        } catch (e) {
            console.log("Aviso: Falha ao limpar dependências (possível diferença de nome de campo)", e);
        }

        await tx.appointment.deleteMany({ where: { id: { in: cancelledIds } } });
      }
    });

    return NextResponse.json({ success: true, processed: pendingToDelete.length });

  } catch (error: any) {
    console.error("Cleanup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}