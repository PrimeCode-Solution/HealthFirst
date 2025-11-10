import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { CreateAppointmentDTO } from "@/modules/appointments/domain/appointment.interface";

export const schema = z.object({
    date: z.string().min(1, "Data é obrigatória"),
    startTime: z.string().min(1, "Horário inicial é obrigatório"),
    endTime: z.string().min(1, "Horário final é obrigatório"),
    patientName: z.string().min(1, "Nome é obrigatório"),
    patientEmail: z.string().email("Email invalido"),
    patientPhone: z.string().regex(/^\d{10,11}$/, "Apenas números são aceitos").optional(),
    notes: z.string().optional(),
});

export const useAppointmentForm = (
    defaultValues?: Partial<CreateAppointmentDTO>,
) => {
    const {
        register,
        handleSubmit,
        formState: { erros, isSubmitting },
        reset,
        control,
    } = useForm<CreateAppointmentDTO>({ resolver: zodResolver(schema), defaultValues, });

    return {
        register,
        handleSubmit,
        erros,
        isSubmitting,
        reset,
        control,
    };
}



