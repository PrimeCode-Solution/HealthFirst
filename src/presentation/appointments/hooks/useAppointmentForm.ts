import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { CreateAppointmentDTO } from "@/modules/appointments/domain/appointment.interface";

export const schema = z.object({
    userId: z.string().min(1, "Id do usuário é necessário"),

    date: z.coerce.date({ 
        message: "Data inválida ou obrigatória" 
    }),
    startTime: z.string().min(1, "Horário inicial é obrigatório"),
    endTime: z.string().min(1, "Horário final é obrigatório"),
    patientName: z.string().min(1, "Nome é obrigatório"),
    type: z.enum(["GENERAL", "URGENT", "FOLLOWUP"]),
    patientEmail: z.string().email("Email inválido").optional().or(z.literal("")),
    patientPhone: z.string().regex(/^\d{10,11}$/, "Apenas números são aceitos").optional().or(z.literal("")),
    notes: z.string().optional(),
});

export const useAppointmentForm = (
    defaultValues?: Partial<CreateAppointmentDTO>,
) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        control,
    } = useForm({ 
        resolver: zodResolver(schema), 
        defaultValues: defaultValues as any, 
    });

    return {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        reset,
        control,
    };
}