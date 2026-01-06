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
    CreditCard,
    UserCheck,
    Video,
    MoreVertical
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
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { Card } from "@/components/ui/card";
  import { Separator } from "@/components/ui/separator";
  import { cn } from "@/lib/utils";
  import { format, isAfter } from "date-fns";
  import { ptBR } from "date-fns/locale";
  
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
    PENDING: { label: "Pendente", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: AlertCircle },
  };
  
  export default function AppointmentCard({
    appointment,
    currentUser,
    onEdit,
    onDelete,
    onComplete,
  }: AppointmentCardProps) {
    const isDoctor = currentUser?.role === "DOCTOR";
    const isAdmin = currentUser?.role === "ADMIN";
    const isPatient = currentUser?.role === "USER";
    const isStaff = isDoctor || isAdmin;
    
    // Tratamento de status para usar a config correta
    const statusKey = appointment.status === 'SCHEDULED' ? 'SCHEDULED' : appointment.status;
    const status = statusConfig[statusKey] || statusConfig.PENDING;
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
      appointment.status !== 'CANCELLED';
  
    const startTime = appointment.startTime?.slice(0, 5) || "--:--";
    
    // Definição dos nomes (Quem vê quem)
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
              Para: {appointment.patientName || "Você"}
          </span>
      );
    }
  
    // Lógica do botão de vídeo: Se tem URL e não está cancelado/concluído
    const showVideoCall = appointment.videoUrl && 
                          appointment.status !== 'CANCELLED' && 
                          appointment.status !== 'COMPLETED';
  
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
      <Card className="group relative overflow-hidden border border-emerald-100/60 bg-white transition-all hover:shadow-md hover:border-emerald-200">
        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", status.color.replace("bg-", "bg-opacity-100 bg-").split(" ")[0])} />
        
        <div className="flex flex-col">
          {/* CORPO PRINCIPAL DO CARD */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
              
              {/* ESQUERDA: Informações de Hora, Nome e Detalhes */}
              <div className="flex items-start gap-4 flex-1">
                  {/* Box de Horário */}
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold shadow-sm">
                      <span className="text-lg leading-none">{startTime}</span>
                      <span className="text-[10px] text-emerald-600/70 uppercase mt-0.5">Início</span>
                  </div>
  
                  <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between md:justify-start gap-2">
                          <div>
                              <h4 className="font-semibold text-gray-900 text-base truncate pr-2">
                                  {mainName}
                              </h4>
                              {subName}
                          </div>
  
                          {/* No mobile, o menu aparece aqui em cima para economizar espaço */}
                          <div className="md:hidden">
                              <ActionMenu 
                                  appointment={appointment} 
                                  isDoctor={isDoctor} 
                                  onEdit={onEdit} 
                                  onDelete={onDelete} 
                                  onComplete={onComplete} 
                              />
                          </div>
                      </div>
  
                      {/* Linha de Detalhes (Tipo, Preço, Contato) */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-muted-foreground">
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
                                      <button className="text-muted-foreground hover:text-emerald-600 transition-colors focus:outline-none flex items-center gap-1 text-xs">
                                          <Info className="h-3 w-3" /> Info
                                      </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-72 p-0" align="start">
                                      <ContactInfo 
                                          name={appointment.patientName} 
                                          email={contactEmail} 
                                          phone={contactPhone} 
                                          getWhatsappLink={getWhatsappLink} 
                                      />
                                  </PopoverContent>
                              </Popover>
                          )}
                      </div>
                  </div>
              </div>
  
              {/* DIREITA: Ações e Status (Desktop) */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mt-2 md:mt-0">
                  
                  {/* Botões de Ação Principal */}
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      {canShowCompleteButton && (isStaff || (isPatient && appointment.userId === currentUser?.id)) && (
                          <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onComplete(appointment)}
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
                              Entrar na Sala
                          </Button>
                      )}
                  </div>
  
                  {/* Badge e Menu (Desktop layout) */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 mt-2 md:mt-0">
                      <Badge variant="outline" className={cn("px-2.5 py-0.5 font-medium flex items-center gap-1.5 h-7", status.color)}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                      </Badge>
  
                      {/* Menu apenas no Desktop (no mobile fica no topo) */}
                      <div className="hidden md:block">
                          <ActionMenu 
                              appointment={appointment} 
                              isDoctor={isDoctor} 
                              onEdit={onEdit} 
                              onDelete={onDelete} 
                              onComplete={onComplete} 
                          />
                      </div>
                  </div>
              </div>
          </div>
  
          {/* FOOTER: Detalhes Técnicos (Apenas Admin) */}
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
                  {appointment.payment?.id && (
                      <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3 text-slate-400" />
                          <span className={appointment.payment.status === 'APPROVED' ? "text-green-600" : "text-yellow-600"}>
                              {appointment.payment.status === 'APPROVED' ? 'Pago' : appointment.payment.status}
                          </span>
                      </div>
                  )}
              </div>
          )}
        </div>
      </Card>
    );
  }
  
  // --- Subcomponentes para limpar o código principal ---
  
  function ActionMenu({ appointment, isDoctor, onEdit, onDelete, onComplete }: any) {
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
                  
                  {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                      <DropdownMenuItem onClick={() => onEdit(appointment)}>
                          Editar detalhes
                      </DropdownMenuItem>
                  )}
                  
                  {isDoctor && appointment.status === 'CONFIRMED' && (
                      <DropdownMenuItem onClick={() => onComplete(appointment)} className="text-emerald-600">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Finalizar Consulta
                      </DropdownMenuItem>
                  )}
  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(appointment.id)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
      )
  }
  
  function ContactInfo({ name, email, phone, getWhatsappLink }: any) {
      return (
          <div className="flex flex-col">
              <div className="p-3 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-700" /> 
                  <span className="font-semibold text-emerald-900 text-sm">Contato do Paciente</span>
              </div>
              <div className="p-3 space-y-3">
                  <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Nome</span>
                      <p className="text-sm font-medium">{name}</p>
                  </div>
                  {email && (
                      <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                              <Mail className="h-3 w-3 text-blue-600" />
                          </div>
                          <a href={`mailto:${email}`} className="text-sm text-blue-600 hover:underline truncate">
                              {email}
                          </a>
                      </div>
                  )}
                  {phone && (
                      <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                              <MessageCircle className="h-3 w-3 text-green-600" />
                          </div>
                          <a href={getWhatsappLink(phone)} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">
                              {phone}
                          </a>
                      </div>
                  )}
              </div>
          </div>
      )
  }