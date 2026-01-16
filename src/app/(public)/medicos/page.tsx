import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/app/providers/prisma";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, User, CalendarDays } from "lucide-react";

export const metadata: Metadata = {
  title: "Nossos Especialistas | HealthFirst",
  description: "Conheça nossa equipe de médicos e especialistas prontos para atender você.",
};

// Removemos "export const dynamic = 'force-dynamic'" pois o Next.js lida bem com isso,
// mas se der erro de cache, você pode descomentar a linha abaixo:
// export const dynamic = 'force-dynamic';

export default async function DoctorsListPage() {
  // 1. Busca todos os médicos no banco de dados
  const doctors = await prisma.user.findMany({
    where: {
      role: "DOCTOR",
    },
    select: {
      id: true,
      name: true,
      specialty: true,
      bio: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-7xl">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Nossos Especialistas
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Encontre o profissional ideal para cuidar da sua saúde.
        </p>
      </div>

      {doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300 border-slate-200">
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <Avatar className="w-16 h-16 border-2 border-primary/10">
                  <AvatarImage src={`/images/doctors/${doctor.id}.png`} alt={doctor.name} />
                  <AvatarFallback className="bg-primary/5 text-primary text-lg font-medium">
                    {getInitials(doctor.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg leading-none">{doctor.name}</h3>
                  <Badge variant="secondary" className="font-normal text-xs">
                    {doctor.specialty || "Especialista"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 pb-4">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                  <p className="line-clamp-3">
                    {doctor.bio || "Profissional dedicado ao atendimento humanizado e excelência clínica na HealthFirst."}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="pt-0 grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/medicos/${doctor.id}`}>
                    Ver Perfil
                  </Link>
                </Button>
                
                <Button className="w-full gap-2" asChild>
                  <Link href={`/agendar-consulta?doctorId=${doctor.id}`}>
                    <CalendarDays className="w-4 h-4" />
                    Agendar
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Nenhum médico encontrado</h3>
          <p className="text-muted-foreground">
            Verifique se você alterou a role do usuário para 'DOCTOR' no banco de dados.
          </p>
        </div>
      )}
    </div>
  );
}