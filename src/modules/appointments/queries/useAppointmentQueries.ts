import api from "@/lib/api";
import { Appointment } from "../domain/appointment.interface";

function useAppointmentQueries() {
    const getAppointments = async (): Promise<Appointment[] | null> => {
        try {
            const response = api.get<Appointment[]>("/appointments");
            return response.data;
        } catch {
            console.error("Get appointments ERROR:")
            return null;
        }
    }

    const getAppointmentById = async (id: string): Promise<Appointment | null> => {
        try {
            const response = api.get<Appointment>(`/appointments/${id}`)
            return response.data;
        } catch (err) {
            console.error("Get appointment error:", err)
            return null;
        }
    }

    const getUserAppointments = async (userId: string): Promise<Appointment[] | null> => {
        try {
            const response = api.get<Appointment>(`/appointments/${userId}`);
            return response.data;
        } catch (err) {
            console.error("Get appointment error:", err)
            return null;
        }
    }
}
