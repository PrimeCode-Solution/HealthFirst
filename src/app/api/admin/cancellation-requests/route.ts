import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { MercadoPagoConfig, PaymentRefund } from 'mercadopago';

const mpClient = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '' 
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({}, { status: 403 });

  const requests = await prisma.cancellationRequest.findMany({
    where: { status: "PENDING" },
    include: {
      appointment: {
        include: {
          user: { select: { name: true, email: true, phone: true } }, 
          payment: true
        }
      }
    },
    orderBy: { requestedAt: 'asc' } 
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") return NextResponse.json({}, { status: 403 });

    const { requestId, action, adminNotes } = await req.json(); 

    const request = await prisma.cancellationRequest.findUnique({
      where: { id: requestId },
      include: { 
        appointment: { 
          include: { 
            payment: true,
            user: true 
          } 
        } 
      }
    });

    if (!request || !request.appointment) {
      return NextResponse.json({ error: "Solicitação ou agendamento não encontrado" }, { status: 404 });
    }

    const appt = request.appointment;
    let refundStatus = "NOT_APPLICABLE";

    if (action === "APPROVE") {
      if (appt.payment?.mercadoPagoId && appt.payment.status === "APPROVED") {
         try {
           const refundClient = new PaymentRefund(mpClient);
           await refundClient.create({ payment_id: appt.payment.mercadoPagoId });
           refundStatus = "SUCCESS";
         } catch (error) {
           console.error("Erro no reembolso MP:", error);
           refundStatus = "FAILED_MP_ERROR";

         }
      }
    } 
    else {
      refundStatus = "DENIED_BY_ADMIN";
    }

    await prisma.$transaction([
      prisma.cancellationRequest.update({
        where: { id: requestId },
        data: { 
          status: action === "APPROVE" ? "APPROVED" : "REJECTED", 
          adminNotes: adminNotes, 
          reviewedAt: new Date() 
        }
      }),


      prisma.appointment.update({
        where: { id: appt.id },
        data: { 
          status: "CANCELLED" 
        }
      }),


      prisma.appointmentHistory.create({
        data: {
          originalId: appt.id,
          userId: appt.userId,
          doctorId: appt.doctorId,
          date: appt.date,
          status: "CANCELLED",
          reason: `REQUEST_REVIEW_${action}_REFUND_${refundStatus}`, 
          amount: appt.payment?.amount || 0
        }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      message: action === "APPROVE" ? "Reembolso aprovado e agendamento cancelado." : "Reembolso negado e agendamento cancelado.",
      refundStatus 
    });

  } catch (error) {
    console.error("Erro ao processar solicitação:", error);
    return NextResponse.json({ error: "Erro interno ao processar" }, { status: 500 });
  }
}