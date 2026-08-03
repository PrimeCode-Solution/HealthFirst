import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  BusinessHoursSchema,
  type BusinessHoursValues,
} from "../schemas/businessHoursSchema";

// Schema compartilhado com o formulário de criação e com a API
export { BusinessHoursSchema, BusinessHoursDaySchema } from "../schemas/businessHoursSchema";
export type { BusinessHoursValues, BusinessHoursDayValues } from "../schemas/businessHoursSchema";

// Hook principal do formulário de business hours
export const useUpdateBusinessHoursForm = (
  defaultValues?: Partial<BusinessHoursValues>
) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    setValue,
    getValues,
    watch,
  } = useForm<BusinessHoursValues>({
    resolver: zodResolver(BusinessHoursSchema),
    defaultValues: defaultValues as BusinessHoursValues,
  });
  return {
    register,
    handleSubmit,
    errors,
    reset,
    isSubmitting,
    control,
    setValue,
    getValues,
    watch,
  };
};
