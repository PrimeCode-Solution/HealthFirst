import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateSubscription } from "@/presentation/subscriptions/mutations/useSubscriptionMutations";

// Schema de validação
const createSubscriptionSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  preapprovalId: z.string().min(1, "ID de pré-aprovação (MP) é obrigatório"),
  planName: z.string().optional(),
  amount: z.coerce.number().min(0, "Valor deve ser positivo").optional(),
  currency: z.string().min(1, "Moeda é obrigatória"),
});

export type CreateSubscriptionFormData = z.infer<typeof createSubscriptionSchema>;

export function useFormInSubscriptions() {
  const form = useForm<CreateSubscriptionFormData>({
    resolver: zodResolver(createSubscriptionSchema) as any, // <--- CORREÇÃO: 'as any' para evitar erro de tipagem no build
    defaultValues: {
      userId: "",
      preapprovalId: "",
      planName: "",
      currency: "BRL",
    },
  });

  const { mutate: createSubscription, isPending } = useCreateSubscription();

  const onSubmit = (data: CreateSubscriptionFormData) => {
    createSubscription(data, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isPending,
  };
}