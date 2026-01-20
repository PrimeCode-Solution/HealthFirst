import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Lista os 5 últimos agendamentos PENDENTES (independente da data)
    const allPending = await prisma.appointment.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true, 
        patientName: true, 
        createdAt: true, 
        paymentReminderSent: true 
      }
    });

    console.log("=== 🕵️ DEBUG DO BANCO DE DADOS ===");
    console.log(`Total de Pendentes encontrados: ${allPending.length}`);
    
    const now = new Date();
    console.log(`Hora atual do Servidor (UTC): ${now.toISOString()}`);

    allPending.forEach(app => {
        const diffInMinutes = (now.getTime() - new Date(app.createdAt).getTime()) / 1000 / 60;
        console.log(`----------------------------------------------`);
        console.log(`🆔 ID: ${app.id}`);
        console.log(`👤 Paciente: ${app.patientName}`);
        console.log(`📅 Criado em: ${app.createdAt.toISOString()}`);
        console.log(`⏱️ Idade: ${diffInMinutes.toFixed(2)} minutos`);
        console.log(`📩 Já enviou lembrete? ${app.paymentReminderSent}`);
        
        if (diffInMinutes > 20) {
            console.log("✅ ESTE DEVERIA SER PEGO PELO CRON!");
        } else {
            console.log("❌ Este é muito novo para o Cron.");
        }
    });

    return NextResponse.json({ 
      debug: true, 
      serverTime: now.toISOString(),
      items: allPending 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}