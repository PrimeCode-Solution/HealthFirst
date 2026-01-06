import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { AppointmentStatus, PaymentStatus } from "@/generated/prisma"; 
import { parseISO, isValid as isValidDate, startOfDay, endOfDay } from "date-fns";
import { z } from "zod";

export const dynamic = "force-dynamic";

// --- Configuração do Mercado Pago ---
const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ 
  accessToken: mpAccessToken || "" 
});
const preference = new Preference(client);

// --- Schema de Validação para o GET ---
const querySchema = z.object({
  status: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  userId: z.string().optional(),
  q: z.string().optional(),
  page: z.string().optional().transform((v) => Math.max(parseInt(v ?? "1", 10) || 1, 1)),
  pageSize: z.string().optional().transform((v) => {
      const n = Math.max(parseInt(v ?? "20", 10) || 20, 1);
      return Math.min(n, 100);
    }),
});

// GET: Listar Agendamentos
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
    }

    const { status, dateStart, dateEnd, userId, q, page, pageSize } = parsed.data;
    const where: any = {};

    // Filtro de Status
    if (status && Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
      where.status = status as AppointmentStatus;
    }

    // Permissão de visualização
    if (session.user.role === "ADMIN" || session.user.role === "DOCTOR") {
      if (userId) where.userId = userId;
    } else {
      where.userId = session.user.id;
    }

    // Filtro de Data
    if (dateStart || dateEnd) {
      const ds = dateStart ? parseISO(dateStart) : undefined;
      const de = dateEnd ? parseISO(dateEnd) : undefined;

      if ((ds && !isValidDate(ds)) || (de && !isValidDate(de))) {
        return NextResponse.json({ error: "invalid_date_range" }, { status: 400 });
      }

      where.date = {};
      if (ds) where.date.gte = startOfDay(ds);
      if (de) where.date.lte = endOfDay(de);
    }

    // Filtro de Busca (Nome do paciente)
    if (q && q.trim()) {
      where.patientName = { contains: q.trim(), mode: "insensitive" };
    }

    const skip = (page - 1) * pageSize;

    const [total, items] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        orderBy: [{ date: "desc" }, { startTime: "asc" }],
        skip,
        take: pageSize,
        include: {
          payment: true,
          consultationType: true, // Incluir os detalhes do tipo de consulta
          user: { select: { id: true, name: true, email: true, phone: true } },
          doctor: { select: { id: true, name: true, email: true } }
        },
      }),
    ]);

    // Sanitização
    const sanitizedItems = items.map((appointment) => {
      const canViewContactInfo =
        session.user.role === "ADMIN" ||
        (session.user.role === "DOCTOR" && appointment.doctorId === session.user.id);

      return {
        ...appointment,
        user: {
          id: appointment.user.id,
          name: appointment.user.name,
          email: canViewContactInfo ? appointment.user.email : null,
          phone: canViewContactInfo ? appointment.user.phone : null,
        },
        patientEmail: canViewContactInfo ? appointment.patientEmail : null,
        patientPhone: canViewContactInfo ? appointment.patientPhone : null,
      };
    });

    return NextResponse.json({
      meta: {
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      },
      items: sanitizedItems,
    });

  } catch (err) {
    console.error("Erro no GET /appointments:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    }

    const body = await req.json();
  
    // Recebemos 'consultationTypeId' (ID do banco) em vez de 'type' (Enum fixo)
    const { 
      date, startTime, endTime, consultationTypeId, description, 
      patientEmail, patientPhone, doctorId, 
      userId, name 
    } = body;
    
    let { patientName } = body; 
    if (!patientName && name) patientName = name;

    if (!date || !consultationTypeId) {
      return NextResponse.json({ error: "Dados obrigatórios (data ou tipo de consulta) faltando." }, { status: 400 });
    }

    // 1. BUSCAR O TIPO E O PREÇO NO BANCO (Validação de Segurança)
    const consultationType = await prisma.consultationType.findUnique({
      where: { id: consultationTypeId }
    });

    if (!consultationType) {
      return NextResponse.json({ error: "Tipo de consulta inválido." }, { status: 400 });
    }

    const amount = Number(consultationType.price); // Usar o preço oficial do banco

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Definição de Usuário e Paciente
    let finalUserId = session.user.id;
    let finalPatientName = patientName;
    let finalPatientEmail = patientEmail || session.user.email;
    let finalPatientPhone = patientPhone;

    const isAdminOrDoctor = session.user.role === "ADMIN" || session.user.role === "DOCTOR";

    if (isAdminOrDoctor) {
      if (userId) finalUserId = userId; // Admin pode agendar para outros users
      if (!finalPatientName) finalPatientName = session.user.name; 
      finalPatientEmail = patientEmail || null; 
    } else {
      // Usuário comum sempre agenda pra si mesmo
      finalUserId = session.user.id;
      finalPatientName = session.user.name; 
      finalPatientEmail = session.user.email;
    }

    if (!finalPatientName) finalPatientName = "Paciente";

    // 2. TRANSAÇÃO: Criar Agendamento + Pagamento
    const { appointment, payment } = await prisma.$transaction(async (tx) => {
      // Verifica se o User ID realmente existe (para evitar o erro que você viu)
      const userExists = await tx.user.findUnique({ where: { id: finalUserId }});
      if (!userExists) {
        throw new Error(`Usuário inválido (ID: ${finalUserId}). Faça login novamente.`);
      }

      const appointmentId = crypto.randomUUID();

      const newAppointment = await tx.appointment.create({
        data: {
          userId: finalUserId,
          doctorId: doctorId,
          date: parseISO(date),
          startTime,
          endTime,
          consultationTypeId: consultationType.id, 
          amount: amount,                          
          
          status: AppointmentStatus.PENDING,
          patientName: finalPatientName,
          patientEmail: finalPatientEmail,
          patientPhone: finalPatientPhone || null,
          videoUrl: `https://meet.jit.si/HealthFirst-${Math.random().toString(36).substring(7)}`,
        }
      });

      const newPayment = await tx.payment.create({
        data: {
          appointmentId: newAppointment.id,
          amount: amount,
          currency: "BRL",
          description: description || `Consulta: ${consultationType.name}`,
          status: PaymentStatus.PENDING,
          payerEmail: session.user.email, 
          payerName: session.user.name
        }
      });

      return { appointment: newAppointment, payment: newPayment };
    });

    // 3. INTEGRAÇÃO MERCADO PAGO
    let initPoint = null;

    if (mpAccessToken) {
      try {
        const mpPreference = await preference.create({
          body: {
            items: [{
              id: appointment.id,
              title: description || `Consulta: ${consultationType.name}`,
              quantity: 1,
              unit_price: amount,
              currency_id: "BRL",
            }],
            payer: {
              email: session.user.email || undefined, 
              name: session.user.name || undefined,
            },
            back_urls: {
              success: `${baseUrl}/success?payment_id=${payment.id}`,
              failure: `${baseUrl}/failure`,
              pending: `${baseUrl}/pending`
            },
            external_reference: payment.id,
            notification_url: `${process.env.NEXT_PUBLIC_API_URL}/webhooks/mercado-pago`,
          }
        });

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            preferenceId: mpPreference.id,
            pendingUrl: mpPreference.init_point,
          },
        });
        
        initPoint = mpPreference.init_point;

      } catch (mpError: any) {
        console.warn("Aviso: Falha ao gerar link de fallback do MP:", mpError.message);
      }
    }

    return NextResponse.json({ 
      appointmentId: appointment.id,
      init_point: initPoint, 
      message: "Agendamento criado com sucesso." 
    }, { status: 201 });

  } catch (e: any) {
    console.error("Erro POST /appointments:", e);
    return NextResponse.json({ error: e.message || "Falha ao criar agendamento." }, { status: 500 });
  }
}