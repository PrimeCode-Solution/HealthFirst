import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers"
import { useAppointmentMutations } from "../mutations/useAppointmentMutations"
import { CreateAppointmentDTO, AppointmentStatus, UpdateAppointmentDTO} from "../domain/appointment.interface";

const appointmentSchema = z.object({
    date: z.string().min(1, "Data é obrigatória"),
    startTime: z.string().min(1, "Horário inicial é obrigatório"),
    endTime: z.string().min(1, "Horário final é obrigatório"),
    patientName: z.string().min(1, "Nome é obrigatório"),
    patientEmail: z.string().email("Email invalido"),
    patientPhone: z.string().regex(/^\d{10,11}$/, "Apenas números são aceitos").optional(),
    notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export function useAppointmentForm() {
    const { createAppointment, updateAppointmentStatus, cancelAppointment } = useAppointmentMutations();

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, } = useForm<AppointmentFormData>({ resolver: zodResolver(appointmentSchema) }
    );

    const onSubmit = async (data: AppointmentFormData) => {
        try {
            const payload: CreateAppointmentDTO = {
                userId: data.userId,
                date: new Date(data.date),
                startTime: data.startTime,
                endTime: data.endTime,
                type: data.ConsultationType,
                patientName: data.patientName,
                patientEmail: data.patientEmail,
                patientPhone: data.patientPhone,
                notes: data.notes,
            }

            const created =  createAppointment(payload);
            reset();
            return created;
        } catch (err){
            console.error("Erro ao criar agendamento:", err)
            return null;
        }
    }

    const onUpdate = async (id: string, status: AppointmentStatus) => {
        try {
            const payload: UpdateAppointmentDTO = {
                id: id,
                status: status,
            }
            const updated = updateAppointmentStatus(payload);
            return updated;
        } catch (err) {
            console.error("Erro ao atualizar agendamento:", err);
            return null;
        }
    }

    const onCancel = async (id: string) => {
        try {
            const cancelled = await cancelAppointment(id);
            return cancelled;
        } catch (err){
            console.error("Erro ao cancelar agendamento:", err);
            return null;
        }
    }

    return {
        register,
        handleSubmit,
        onSubmit,
        onUpdate,
        onCancel,
        errors,
        isSubmitting,
        reset,
    };
}


