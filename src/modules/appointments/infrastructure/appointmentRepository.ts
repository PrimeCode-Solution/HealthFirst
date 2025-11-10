import api from '@/lib/api';
import type { Appointment, CreateAppointmentDTO, UpdateAppointmentStatusDTO } from "../domain/appointment.interface";
import type { AppointmentRepositoryDomain } from "../domain/appointmentsRepository";


export function AppointmentRepository(): AppointmentRepositoryDomain {
    return {
        findAll,
        findById,
        findByUser,
        create,
        update,
        delete: deleteAppointment,
    }

    async function findAll(): Promise<Appointment[]> {
        const response = await api.get('/appointments')
        return response.data
    }

    async function findById(id: string): Promise<Appointment> {
        const response = await api.get(`/appointments/${id}`);
        return response.data
    }

    async function findByUser(userId: string): Promise<Appointment[]> {
        const response = await api.get(`/appointments/user/${userId}`);
        return response.data
    }

    async function create(data: CreateAppointmentDTO): Promise<Appointment> {
        const response = await api.post(`/appointments`, data)
        return response.data
    }

    async function update(data: UpdateAppointmentStatusDTO): Promise<Appointment> {
        const { id, status } = data
        const response = await api.put(`/appointments/${id}`, { status })
        return response.data
    }

    async function deleteAppointment(id: string): Promise<Appointment> {
        const response = await api.delete(`/appointments/${id}`);
        return response.data
    }
}
