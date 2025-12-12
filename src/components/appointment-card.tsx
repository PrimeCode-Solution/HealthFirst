"use client";

import { Clock, User, Trash2, Edit2, Ban, Info, Phone, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export default function AppointmentCard({
  appointment,
  onEdit,
  onDelete,
  onComplete,
  currentUser,
}: {
  appointment: any;
  onEdit: (apt: any) => void;
  onDelete: (id: string) => void;
  onComplete: (apt: any) => void;
  currentUser: any;
}) {
  // Permissões
  const isOwner = currentUser?.id === appointment.userId;
  const isAdmin = currentUser?.role === "ADMIN";
  const isAssignedDoctor = appointment.doctorId === currentUser?.id;
  const canDelete = isOwner || isAdmin || isAssignedDoctor;

  const canViewContact = isAdmin || (currentUser?.role === "DOCTOR" && isAssignedDoctor);

  const authorizedComplete = isAdmin || isAssignedDoctor;
  let canCompleted = false;
  const now = new Date();
  const appointmentDate = new Date(appointment.date);

  if (
    authorizedComplete &&
    (appointment.status === "CONFIRMED" ||
     appointment.status === "COMPLETED") &&
    now >= appointmentDate
  ) {
    canCompleted = true;
  }

  const handleDeleteClick = () => {
    if (!canDelete) {
      toast.error("Você não tem permissão para excluir este agendamento.");
      return;
    }
    onDelete(appointment.id);
  };

  // Dados de contato com fallback
  const contactEmail = appointment.patientEmail || appointment.user?.email;
  const contactPhone = appointment.patientPhone || appointment.user?.phone;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg mb-2 bg-card hover:bg-accent/5 transition-colors">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 font-semibold">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            {appointment.startTime} - {appointment.endTime}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{appointment.patientName}</span>
        </div>

        {/* Botão de contato */}
        {canViewContact && (
          <div className="mt-">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="h-9">
                  <Info className="mt-0.5 h-4 w-4" />
                  Ver Contato
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-base mb-3">Contato do Paciente</p>
                  </div>

                  <Separator />

                  {/* Nome */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Nome</span>
                    </div>
                    <p className="text-sm pl-6">{appointment.patientName}</p>
                  </div>

                  <Separator />

                  {/* Email */}
                  {contactEmail && (
                    <>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>E-mail</span>
                        </div>
                        <a
                          href={`mailto:${contactEmail}`}
                          className="text-sm pl-6 text-blue-600 hover:underline block break-all"
                        >
                          {contactEmail}
                        </a>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Telefone */}
                  {contactPhone && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>Telefone</span>
                      </div>
                      <a
                        href={`tel:${contactPhone}`}
                        className="text-sm pl-6 text-blue-600 hover:underline block"
                      >
                        {contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant={
            appointment.status === "CONFIRMED" ? "default" : "secondary"
          }
        >
          {appointment.status}
        </Badge>

        <Button variant="outline" size="icon" onClick={() => onEdit(appointment)}>
          <Edit2 className="h-4 w-4" />
        </Button>

        <Button
          variant="destructive"
          size="icon"
          onClick={handleDeleteClick}
          className={
            !canDelete
              ? "opacity-50 cursor-not-allowed hover:bg-destructive"
              : ""
          }
          title={!canDelete ? "Permissão negada" : "Excluir agendamento"}
        >
          {canDelete ? <Trash2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
        </Button>

        {canCompleted && (
          appointment.status === "COMPLETED" ? (
            <Button variant="ghost" disabled>
              Concluído
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => onComplete(appointment)}
            >
              Finalizar atendimento
            </Button>
          )
        )}
      </div>
    </div>
  );
}
