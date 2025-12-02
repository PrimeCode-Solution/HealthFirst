import api from "@/lib/api";
import {
  Appointment,
  CreateAppointmentDTO,
  UpdateAppointmentStatusDTO,
} from "@/modules/appointments/domain/appointment.interface";

interface FindAppointmentsFilters {
  dateStart?: string;
  dateEnd?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

async function createAppointment(
  data: CreateAppointmentDTO,
): Promise<Appointment> {
  const response = await api.post(`/appointments`, data);

  return response.data.appointment;
}

async function findAllAppointments(filters?: FindAppointmentsFilters): Promise<Appointment[]> {

  const response = await api.get("/appointments", { params: filters });
  return response.data.items || [];
}

async function findAppointmentById(id: string): Promise<Appointment> {
  const response = await api.get(`/appointments/${id}`);
  return response.data; 
}

async function findAppointmentsByUser(userId: string): Promise<Appointment[]> {
  const response = await api.get(`/appointments/user/${userId}`);
  return response.data.items || [];
}

async function updateAppointmentStatus(
  data: UpdateAppointmentStatusDTO,
): Promise<Appointment> {
  const { id, status } = data;
  const response = await api.put(`/appointments/${id}`, { status });
  
  return response.data;
}

async function updateAppointment(
  id: string,
  data: Partial<CreateAppointmentDTO>
): Promise<Appointment> {
  const response = await api.put(`/appointments/${id}`, data);
  return response.data;
}

async function deleteAppointment(id: string): Promise<void> {
  await api.delete(`/appointments/${id}`);
}

export const appointmentService = {
    createAppointment,
    findAllAppointments,
    findAppointmentById,
    findAppointmentsByUser,
    updateAppointmentStatus,
    updateAppointment,
    deleteAppointment,
};