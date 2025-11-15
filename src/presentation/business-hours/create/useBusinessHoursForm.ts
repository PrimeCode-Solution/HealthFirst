import {z} from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import type { CreateBusinessHoursDTO } from "@/modules/business-hours/domain/businessHours.interface";

//Schema de validação com Zod
export const BusinessHoursSchema = z.object({
    startTime: z.string().min(5, "Horário inicial obrigatório"),
    endTime: z.string().min(5, "Horário final obrigatório"),

    lunchBreakEnabled: z.boolean(),

    lunchStartTime: z.string().optional().or(z.literal("")),
    lunchEndTime: z.string().optional().or(z.literal("")),

    mondayEnabled: z.boolean().optional(),
    tuesdayEnabled: z.boolean().optional(),
    wednesdayEnabled: z.boolean().optional(),
    thursdayEnabled: z.boolean().optional(),
    fridayEnabled: z.boolean().optional(),
    saturdayEnabled: z.boolean().optional(),
    sundayEnabled: z.boolean().optional(),

    appointmentDuration: z.preprocess((val) => {
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? undefined : parsed;
  }
  return val;
}, z.number({ error: "Campo obrigatório" }).min(5, "Duração minima de 5 minutos"))

});
//Hook principal do formulário de business hours
export const useBusinessHoursForm = (
    
) => {
    const {
        register, 
        handleSubmit,
        formState: { errors, isSubmitting},
        reset,
        control, 
        setValue,
        watch,
    } = useForm<CreateBusinessHoursDTO>({
        resolver: zodResolver(BusinessHoursSchema),
        
    });
    return{
        register,
        handleSubmit,
        errors,
        reset,
        isSubmitting,
        control,
        setValue,
        watch,
    };
};