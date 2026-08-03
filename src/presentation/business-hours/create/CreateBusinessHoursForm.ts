import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  BusinessHoursSchema,
  type BusinessHoursValues,
} from "../schemas/businessHoursSchema";

// Schema compartilhado com o formulário de atualização e com a API
export { BusinessHoursSchema, BusinessHoursDaySchema } from "../schemas/businessHoursSchema";
export type { BusinessHoursValues, BusinessHoursDayValues } from "../schemas/businessHoursSchema";

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
  } = useForm<BusinessHoursValues>({
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
