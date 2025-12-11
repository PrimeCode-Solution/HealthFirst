"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ptBR } from "react-day-picker/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCreateAppointmentMutation as CreateAppointmentForm } from "@/presentation/appointments/create/useCreateAppointmentMutation";
import { EditAppointmentForm } from "@/presentation/appointments/update/EditAppointmentForm";
import { useAppointments } from "@/presentation/appointments/queries/useAppointmentQueries";
import { useDeleteAppointmentMutation } from "@/presentation/appointments/mutations/useAppointmentMutations";
import AppointmentCard from "@/components/appointment-card";
import { startOfDay, endOfDay, format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function AgendamentosPage() {
  const { data: session } = useSession();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteMutation = useDeleteAppointmentMutation();

  const filters = date
    ? {
        dateStart: startOfDay(date).toISOString(),
        dateEnd: endOfDay(date).toISOString(),
        pageSize: 100,
      }
    : undefined;

  const { data: appointmentsData, isLoading } = useAppointments(filters);
  const appointments = Array.isArray(appointmentsData)
    ? appointmentsData
    : (appointmentsData as any)?.items || [];

  const handleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => setDeletingId(null),
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Agendamentos</h1>
        <p className="text-muted-foreground">Gerencie sua agenda diária.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Calendário */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Lista de agendamentos */}
        <Card className="min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {date ? format(date, "dd 'de' MMMM", { locale: ptBR }): "Selecione uma data"}
            </CardTitle>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Novo Agendamento</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Agendamento</DialogTitle>
                </DialogHeader>
                <CreateAppointmentForm />
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : appointments.length > 0 ? (
              <div className="space-y-2">
                {appointments.map((apt: any) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    currentUser={session?.user}
                    onEdit={(apt) => setEditingAppointment(apt)}
                    onDelete={(id) => setDeletingId(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>Nenhum agendamento encontrado para este dia.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de edição */}
      <Dialog
        open={!!editingAppointment}
        onOpenChange={(open) => !open && setEditingAppointment(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
          </DialogHeader>
          {editingAppointment && (
            <EditAppointmentForm
              appointment={editingAppointment}
              onSuccess={() => setEditingAppointment(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O agendamento será excluído
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
