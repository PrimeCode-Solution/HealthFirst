// src/components/appointment-card.tsx
import { useState } from "react"; 
import {
  CalendarIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Stethoscope,
  Banknote,
  Mail,
  User,
  Info,
  MessageCircle,
  Hash,
  Clock,
  UserCheck,
  Video,
  MoreVertical,
  ExternalLink
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AppointmentCardProps {
  appointment: any;
  currentUser: any;
  onEdit: (apt: any) => void;
  onDelete: (id: string) => void; 
  onComplete: (apt: any) => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  SCHEDULED: { label: "Agendado", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CalendarIcon },
  CONFIRMED: { label: "Confirmado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  COMPLETED: { label: "Concluído", color: "bg-gray-100 text-gray-700 border-gray-200", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelado", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  CANCELLATION_REQUESTED: { label: "Em Análise", color: "bg-orange-50 text-orange-700 border-orange-200", icon: Clock }, 
  PENDING: { label: "Pendente", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: AlertCircle },
};

export default function AppointmentCard({
  appointment,
  currentUser,
  onEdit,
  onComplete,
}: AppointmentCardProps) {
    const router = useRouter(); 
    // Estado para o diálogo de Cancelamento
    const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);
    // NOVO: Estado para o diálogo de Conclusão
    const [isCompleteDialogOpen, setCompleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

  const isDoctor = currentUser?.role === "DOCTOR";
  const isAdmin = currentUser?.role === "ADMIN";
  const isPatient = currentUser?.role === "USER";
  const isStaff = isDoctor || isAdmin;
  
  const statusKey = statusConfig[appointment.status] ? appointment.status : 'PENDING';
  const status = statusConfig[statusKey];
  const StatusIcon = status.icon;

  const getAppointmentDateTime = () => {
    const dateObj = new Date(appointment.date);
    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth();
    const day = dateObj.getUTCDate();
    const [hours, minutes] = (appointment.startTime || "00:00").split(':').map(Number);
    return new Date(year, month, day, hours, minutes);
  };

  const hasPassed = isAfter(new Date(), getAppointmentDateTime());
  
  const canShowCompleteButton = 
    hasPassed && 
    appointment.status !== 'COMPLETED' && 
    appointment.status !== 'CANCELLED' &&
    appointment.status !== 'CANCELLATION_REQUESTED';

    const handleCancel = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/appointments/${appointment.id}`, {
            method: "DELETE",
          });
    
          const data = await response.json();
    
          if (!response.ok) {
            if (response.status === 409) {
               toast.error("Já existe uma solicitação de cancelamento em análise para este agendamento.");
               setCancelDialogOpen(false);
               return;
            }
            throw new Error(data.error || "Erro ao cancelar");
          }
    
          if (data.status === "REVIEW_REQUIRED") {
            toast.warning("Solicitação enviada para análise", {
              description: "Como faltam menos de 24h, um administrador analisará o reembolso.",
              duration: 5000,
            });
          } else {
            toast.success("Agendamento cancelado com sucesso", {
              description: data.refunded ? "O reembolso foi processado." : "Agendamento removido.",
            });
          }
          router.refresh();
    
        } catch (error) {
          toast.error("Erro", { description: "Não foi possível cancelar o agendamento." });
        } finally {
          setIsLoading(false);
          setCancelDialogOpen(false);
        }
      };

  const showVideoCall = appointment.videoUrl && 
                          appointment.status !== 'CANCELLED' && 
                          appointment.status !== 'COMPLETED' &&
                          appointment.status !== 'CANCELLATION_REQUESTED';

  const startTime = appointment.startTime?.slice(0, 5) || "--:--";
  
  // ... (lógica de nomes mantida igual)
  let mainName = "";
  let subName = null;
  if (isStaff) {
    mainName = appointment.patientName || appointment.user?.name || "Paciente sem nome";
    if (isAdmin) {
        subName = (
            <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal bg-slate-100 text-slate-500 hover:bg-slate-200">
                    <UserCheck className="h-3 w-3 mr-1" /> 
                    Dr(a). {appointment.doctor?.name || "N/A"}
                </Badge>
            </div>
        );
    }
  } else {
    mainName = appointment.doctor?.name || "Dr. Não atribuído";
    subName = (
        <span className="text-xs text-muted-foreground block mt-0.5">
            Especialista
        </span>
    );
  }

  const canViewContact = isAdmin || (isDoctor && appointment.doctorId === currentUser?.id);
  const contactEmail = appointment.patientEmail || appointment.user?.email;
  const contactPhone = appointment.patientPhone || appointment.user?.phone;
  const createdAtFormatted = appointment.createdAt 
    ? format(new Date(appointment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : "Data desconhecida";

  const getWhatsappLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, ""); 
    const finalNumber = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    return `https://wa.me/${finalNumber}`;
  };

  return (
    <>
      <Card className="group relative overflow-hidden border border-emerald-100/60 bg-white transition-all hover:shadow-md hover:border-emerald-200">
        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", status.color.replace("bg-", "bg-opacity-100 bg-").split(" ")[0])} />
        
        <div className="flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
              
              <div className="flex items-start gap-4 flex-1">
                  {/* ... (parte visual do horário e nome mantida) */}
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold shadow-sm">
                      <span className="text-lg leading-none">{startTime}</span>
                      <span className="text-[10px] text-emerald-600/70 uppercase mt-0.5">Início</span>
                  </div>

                  <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                          <div>
                              <h4 className="font-semibold text-gray-900 text-base truncate pr-2">
                                  {mainName}
                              </h4>
                              {subName}
                          </div>
                          
                          <div className="md:hidden pl-2">
                              <ActionMenu 
                                  appointment={appointment} 
                                  isDoctor={isDoctor} 
                                  isPatient={isPatient}
                                  onEdit={onEdit} 
                                  onRequestCancel={() => setCancelDialogOpen(true)}
                                  // Passamos a função que abre o dialog local
                                  onRequestComplete={() => setCompleteDialogOpen(true)} 
                              />
                          </div>
                      </div>

                      {/* ... (detalhes do card mantidos) */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5 text-xs font-medium bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                              <Stethoscope className="h-3 w-3 text-emerald-600" />
                              <span className="truncate max-w-[150px]">
                                  {appointment.type === 'GENERAL' && 'Consulta Geral'}
                                  {appointment.type === 'URGENT' && 'Urgência'}
                                  {appointment.type === 'FOLLOWUP' && 'Retorno'}
                                  {!['GENERAL', 'URGENT', 'FOLLOWUP'].includes(appointment.type) && (appointment.type || 'Consulta')}
                              </span>
                          </div>
                          {isStaff && (
                              <div className="flex items-center gap-1.5 text-xs">
                                  <Banknote className="h-3 w-3" />
                                  <span>R$ {Number(appointment.amount).toFixed(2)}</span>
                              </div>
                          )}
                           {canViewContact && (
                              <Popover>
                                  <PopoverTrigger asChild>
                                      <button className="text-muted-foreground hover:text-emerald-600 transition-colors focus:outline-none flex items-center gap-1 text-xs cursor-pointer">
                                          <Info className="h-3 w-3" /> Info
                                      </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-72 p-0" align="start">
                                      <ContactInfo name={appointment.patientName} email={contactEmail} phone={contactPhone} getWhatsappLink={getWhatsappLink} />
                                  </PopoverContent>
                              </Popover>
                          )}
                      </div>
                  </div>
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                  
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      {canShowCompleteButton && (isStaff || (isPatient && appointment.userId === currentUser?.id)) && (
                          <Button 
                              size="sm" 
                              variant="outline"
                              // ALTERADO: Agora abre o dialog local
                              onClick={() => setCompleteDialogOpen(true)}
                              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 w-full md:w-auto h-9"
                          >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Concluir
                          </Button>
                      )}

                      {showVideoCall && (
                          <Button 
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full md:w-auto h-9 font-medium"
                              onClick={() => window.open(appointment.videoUrl!, '_blank')}
                          >
                              <Video className="mr-2 h-4 w-4" />
                              Sala Virtual
                          </Button>
                      )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3">
                      <Badge variant="outline" className={cn("px-2.5 py-0.5 font-medium flex items-center gap-1.5 h-7", status.color)}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                      </Badge>

                      <div className="hidden md:block">
                          <ActionMenu 
                              appointment={appointment} 
                              isDoctor={isDoctor}
                              isPatient={isPatient}
                              onEdit={onEdit} 
                              onRequestCancel={() => setCancelDialogOpen(true)}
                              // Passamos a função que abre o dialog local
                              onRequestComplete={() => setCompleteDialogOpen(true)} 
                          />
                      </div>
                  </div>
              </div>
          </div>
          {/* ... (footer do card mantido) */}
          {isAdmin && (
               <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 text-[10px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1 items-center">
                  <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{createdAtFormatted}</span>
                  </div>
                  <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3 text-slate-400" />
                      <span className="font-mono">{appointment.id.slice(-8)}...</span>
                  </div>
              </div>
          )}
        </div>
      </Card>

      {/* Dialog de Cancelamento (Já existia) */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Se faltar menos de 24h para a consulta, o reembolso será enviado para análise administrativa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); 
                handleCancel();
              }}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isLoading ? "Processando..." : "Sim, cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* NOVO: Dialog de Conclusão */}
      <AlertDialog open={isCompleteDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-900">
              Finalizar Atendimento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Marcar esta consulta como concluída? Isso atualizará o histórico do paciente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                  onComplete(appointment); 
                  setCompleteDialogOpen(false);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Concluir Consulta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ActionMenu({ appointment, isDoctor, isPatient, onEdit, onRequestCancel, onRequestComplete }: any) {
    const isCompletedOrCancelled = ['COMPLETED', 'CANCELLED', 'CANCELLATION_REQUESTED'].includes(appointment.status);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-full">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Opções</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {!isPatient && !isCompletedOrCancelled && (
                    <DropdownMenuItem onClick={() => onEdit(appointment)}>
                        Editar detalhes
                    </DropdownMenuItem>
                )}
                
                {isDoctor && appointment.status === 'CONFIRMED' && (
                    // Alterado para chamar onRequestComplete
                    <DropdownMenuItem onClick={onRequestComplete} className="text-emerald-600">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Finalizar Consulta
                    </DropdownMenuItem>
                )}

                {appointment.videoUrl && !isCompletedOrCancelled && (
                      <DropdownMenuItem onClick={() => window.open(appointment.videoUrl, '_blank')}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir Link da Sala
                      </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                
                {!isCompletedOrCancelled && (
                    <DropdownMenuItem 
                        onClick={onRequestCancel} 
                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar Agendamento
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function ContactInfo({ name, email, phone, getWhatsappLink }: any) {
    // ... (mantido igual)
    return (
        <div className="flex flex-col">
            <div className="p-3 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-700" /> 
                <span className="font-semibold text-emerald-900 text-sm">Contato</span>
            </div>
            <div className="p-3 space-y-3">
                <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Nome</span>
                    <p className="text-sm font-medium">{name}</p>
                </div>
                {email && (
                    <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-blue-600" />
                        <a href={`mailto:${email}`} className="text-sm text-blue-600 hover:underline truncate">{email}</a>
                    </div>
                )}
                {phone && (
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-3 w-3 text-green-600" />
                        <a href={getWhatsappLink(phone)} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">{phone}</a>
                    </div>
                )}
            </div>
        </div>
    )
}