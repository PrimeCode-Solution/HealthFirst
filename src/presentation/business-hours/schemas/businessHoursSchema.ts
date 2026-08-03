import { z } from "zod";
import { validateWeekSchedule } from "@/modules/business-hours/domain/weeklySchedule";

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:mm");

const optionalTimeString = z.union([timeString, z.literal("")]).nullish();

// Escala de um dia da semana. dayOfWeek: 0 = Domingo ... 6 = Sábado.
export const BusinessHoursDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  enabled: z.boolean(),
  startTime: timeString,
  endTime: timeString,
  lunchBreakEnabled: z.boolean(),
  lunchStartTime: optionalTimeString,
  lunchEndTime: optionalTimeString,
  appointmentDuration: z
    .number()
    .int()
    .min(5, "Duração mínima de 5 minutos")
    .max(480, "Duração máxima de 480 minutos")
    .nullable()
    .optional(),
});

export type BusinessHoursDayValues = z.infer<typeof BusinessHoursDaySchema>;

export const BusinessHoursSchema = z
  .object({
    // Campos globais: continuam servindo de padrão para dias sem escala própria
    startTime: timeString,
    endTime: timeString,

    lunchBreakEnabled: z.boolean().optional(),
    lunchStartTime: optionalTimeString,
    lunchEndTime: optionalTimeString,

    mondayEnabled: z.boolean().optional(),
    tuesdayEnabled: z.boolean().optional(),
    wednesdayEnabled: z.boolean().optional(),
    thursdayEnabled: z.boolean().optional(),
    fridayEnabled: z.boolean().optional(),
    saturdayEnabled: z.boolean().optional(),
    sundayEnabled: z.boolean().optional(),

    appointmentDuration: z
      .number({ error: "Campo obrigatório" })
      .int()
      .min(5, "Duração mínima de 5 minutos")
      .max(480, "Duração máxima de 480 minutos"),

    // Escala por dia da semana
    days: z.array(BusinessHoursDaySchema).max(7).optional(),
  })
  // Regras de coerência (almoço dentro do expediente, fim > início, etc.) vivem
  // no domínio para que API e formulário validem exatamente a mesma coisa.
  .superRefine((values, ctx) => {
    if (!values.days?.length) return;

    const days = values.days.map((day) => ({
      ...day,
      appointmentDuration: day.appointmentDuration ?? values.appointmentDuration,
    }));

    for (const message of validateWeekSchedule(days)) {
      ctx.addIssue({ code: "custom", message, path: ["days"] });
    }
  });

export type BusinessHoursValues = z.infer<typeof BusinessHoursSchema>;
