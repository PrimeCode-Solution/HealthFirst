import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppointmentRepository } from '@/modules/appointments/infrastructure/appointmentRepository';
import { CreateAppointmentDTO, UpdateAppointmentStatusDTO } from '@/modules/appointments/domain/appointment.interface';

const repository = AppointmentRepository();

export function useCreateAppointment() {
    const queryClient = useQueryClient();

    return useMutation({
    mutationFn: (data: CreateAppointmentDTO) => repository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar agendamento');
    },
  });
}

export function onUpdateAppointmentStatus() {
     const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateAppointmentStatusDTO) => repository.update(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', variables.id] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });
}

export function onCancelAppointment(id: string) {
    const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => repository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Agendamento cancelado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao cancelar agendamento');
    },
  });
}




