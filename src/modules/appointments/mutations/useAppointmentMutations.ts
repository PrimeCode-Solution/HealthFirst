import api from "@/lib/api";
import { Appointment, CreateAppointmentDTO, UpdateAppointmentStatusDTO } from "../domain/appointment.interface";

export function useAppointmentMutations() {
    const createAppointment = async (data: CreateAppointmentDTO): Promise<Appointment | null> => {
        try {
            const response = await api.post<Appointment>("/appointments", data);
            return response.data;
        } catch (error) {
            console.error("Create appointment ERROR:", error);
            return null;
        }
    }

    const updateAppointmentStatus = async (data: UpdateAppointmentStatusDTO): Promise<Appointment | null> =>  {
        try {
            const response = await api.patch<Appointment>(`/appointments/${data.id}/status`,
                { status: data.status })
            return response.data;
        } catch(error) {
            console.error("Update appointment ERROR:", error)
            return null;
        }
    }

    const cancelAppointment = async (id: string) => {
        try {
            const response = api.post<Appointment>(`/appointments/${id}/cancel`);
            return response.data;
        } catch (error) {
            console.error("Cancel appointment ERROR:", error);
            return null;
        }
    }

    return { createAppointment, updateAppointmentStatus, cancelAppointment }
}


