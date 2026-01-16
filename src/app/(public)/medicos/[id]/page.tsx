import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/app/providers/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, ShieldCheck, Star } from "lucide-react";
import { DoctorBio } from "@/components/doctor/doctor-bio";
import { DoctorScheduleViewer } from "@/components/doctor/doctor-schedule-viewer";

interface DoctorPageProps {
  params: Promise<{ id: string }>; // Atualizado para Promise (Next.js 15)
}

export async function generateMetadata({ params }: DoctorPageProps): Promise<Metadata> {
  const { id } = await params; // await obrigatório
  const doctor = await prisma.user.findUnique({
    where: { id },
    select: { name: true, specialty: true }
  });

  if (!doctor) return { title: "Médico não encontrado" };

  return {
    title: `${doctor.name} - ${doctor.specialty || "Especialista"} | HealthFirst`,
  };
}

export default async function DoctorProfilePage({ params }: DoctorPageProps) {
  const { id } = await params; // await obrigatório

  const doctor = await prisma.user.findUnique({
    where: { id, role: 'DOCTOR' },
    include: { businessHours: true },
  });

  if (!doctor) notFound();

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-10 items-start md:items-center">
        <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white shadow-lg">
          <AvatarImage src={`/images/doctors/${doctor.id}.png`} alt={doctor.name} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">{getInitials(doctor.name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dr(a). {doctor.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm px-3 py-1">{doctor.specialty || "Clínico Geral"}</Badge>
              <div className="flex items-center text-yellow-500 text-sm font-medium">
                <Star className="w-4 h-4 fill-current mr-1" />
                <span>4.9</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <ShieldCheck className="w-4 h-4 text-green-600" />
             <span>Profissional verificado pela HealthFirst</span>
          </div>
        </div>

        <div className="w-full md:w-auto mt-4 md:mt-0">
          <Button asChild size="lg" className="w-full md:w-auto gap-2 shadow-md">
            <Link href={`/agendar-consulta?doctorId=${doctor.id}`}>
              <CalendarCheck className="w-5 h-5" />
              Agendar Consulta
            </Link>
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <DoctorBio bio={doctor.bio} />
          {!doctor.bio && (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed text-muted-foreground">
              Descrição profissional não disponível.
            </div>
          )}
        </div>
        <div className="md:col-span-1">
          <div className="sticky top-24">
            <DoctorScheduleViewer businessHours={doctor.businessHours} />
          </div>
        </div>
      </div>
    </div>
  );
}