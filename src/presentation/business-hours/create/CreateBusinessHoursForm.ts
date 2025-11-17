import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CreateBusinessHoursDTO } from "@/modules/business-hours/domain/businessHours.interface";

//Schema de validação com Zod
export const BusinessHoursSchema = z.object({
  startTime: z.string().min(5, "Horário inicial obrigatório"),
  endTime: z.string().min(5, "Horário final obrigatório"),

  lunchStartTime: z.string().optional(),
  lunchEndTime: z.string().optional(),
  lunchBreakEnabled: z.boolean().optional(),

  mondayEnabled: z.boolean().optional(),
  tuesdayEnabled: z.boolean().optional(),
  wednesdayEnabled: z.boolean().optional(),
  thursdayEnabled: z.boolean().optional(),
  fridayEnabled: z.boolean().optional(),
  saturdayEnabled: z.boolean().optional(),
  sundayEnabled: z.boolean().optional(),

  appointmentDuration: z
    .number({ error: "Campo obrigatório" })
    .min(5, "Duração minima de 5 minutos"),
});

//Hook principal do formulário de business hours
export const useBusinessHoursForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    setValue,
    watch,
  } = useForm<CreateBusinessHoursDTO>({
    resolver: zodResolver(BusinessHoursSchema),
  });
  return {
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