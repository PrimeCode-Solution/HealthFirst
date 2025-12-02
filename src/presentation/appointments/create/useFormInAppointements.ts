import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateAppointmentMutation } from "../mutations/useAppointmentMutations";

export const ConsultationTypeSchema = z.enum(["GENERAL", "URGENT", "FOLLOWUP"]);

const CreateAppointmentSchema = z.object({
  userId: z.string().optional(),
  date: z.date(),
  startTime: z.string().min(1, "Horário inicial obrigatório"),
  endTime: z.string().min(1, "Horário final obrigatório"),
  type: ConsultationTypeSchema,
  patientName: z.string().min(1, "Nome é obrigatório"),
  patientEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  patientPhone: z.string().optional(),
  notes: z.string().optional(),
  amount: z.coerce.number().min(1, "O valor deve ser maior que 0"),
  description: z.string().min(1, "Descrição é obrigatória"),
});

export type CreateAppointmentType = z.infer<typeof CreateAppointmentSchema>;

export function CreateAppointmentForm() {
  const form = useForm<CreateAppointmentType>({
    resolver: zodResolver(CreateAppointmentSchema),
    defaultValues: {
      userId: "",
      date: new Date(),
      startTime: "",
      endTime: "",
      type: "GENERAL",
      patientName: "",
      patientEmail: "",
      patientPhone: "",
      notes: "",
      amount: 99.99, 
      description: "Consulta Médica",
    },
  });

  const createAppointment = useCreateAppointmentMutation();

  const onSubmit = form.handleSubmit((data: CreateAppointmentType) => {
    createAppointment.mutate(data, {
      onSuccess: () => {
        form.reset();
      },
    });
  });

  return {
    form,
    onSubmit,
  };
}