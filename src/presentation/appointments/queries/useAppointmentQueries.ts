import { AppointmentRepository } from "@/modules/appointments/infrastructure/appointmentRepository";
import { useQuery } from '@tanstack/react-query';

const repository = AppointmentRepository();

export function useAppointments() {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: () => repository.findAll(),
  });
}

export function useAppointmentById(id: string) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () => repository.findById(id),
    enabled: !!id,
  });
}

export function useUserAppointments(userId: string) {
  return useQuery({
    queryKey: ['appointments', 'user', userId],
    queryFn: () => repository.findByUser(userId),
    enabled: !!userId,
  });
}




