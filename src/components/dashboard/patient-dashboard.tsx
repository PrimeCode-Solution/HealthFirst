"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import AppointmentCard from "@/components/appointment-card";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export function PatientDashboard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["my-appointments"],
    queryFn: async () => {
      const res = await api.get("/appointments?pageSize=100");
      return res.data.items;
    },
    refetchInterval: 5000, 
    refetchOnWindowFocus: true, 
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.put(`/appointments/${id}`, { status: "CANCELLED" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      toast.success("Agendamento cancelado.");
      setCancelId(null);
    },
    onError: () => {
      toast.error("Erro ao cancelar. Tente novamente.");
    }
  });

  const upcomingAppointments = appointments?.filter((apt: any) => 
    apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED'
  ) || [];

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Olá, {session?.user?.name}</h2>
          <p className="text-muted-foreground">
            Acompanhe seus agendamentos e saúde.
          </p>
        </div>
        <Link href="/agendar-consulta">
          <Button className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Consultas futuras</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            Suas Consultas
        </h3>

        {isLoading ? (
           <div className="flex justify-center py-10">
             <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
           </div>
        ) : upcomingAppointments.length > 0 ? (
          <div className="grid gap-6">
            {upcomingAppointments.map((apt: any) => (
              <AppointmentCard 
                key={apt.id}
                appointment={apt}
                currentUser={session?.user} 
                onDelete={(id) => setCancelId(id)} 
                onEdit={() => {}} 
                onComplete={() => {}} 
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhum agendamento encontrado.
              </p>
              <Link href="/agendar-consulta" className="mt-4">
                <Button variant="outline">Agendar agora</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar consulta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => cancelId && cancelMutation.mutate(cancelId)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {cancelMutation.isPending ? "Cancelando..." : "Sim, Cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}