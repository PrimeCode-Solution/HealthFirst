import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateSubscription } from "@/presentation/subscriptions/mutations/useSubscriptionMutations";
import { SubscriptionStatus } from "@/modules/subscriptons/domain/subscription.interface";
import { Subscription } from "@/modules/subscriptons/domain/subscription.interface";

const updateSubscriptionSchema = z.object({
  planName: z.string().optional(),
  amount: z.coerce.number().min(0).optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
});

export type UpdateSubscriptionFormData = z.infer<typeof updateSubscriptionSchema>;

export function useFormUpSubscriptions(subscription?: Subscription) {
  const form = useForm<UpdateSubscriptionFormData>({
    resolver: zodResolver(updateSubscriptionSchema) as any, // <--- CORREÇÃO: 'as any' adicionado
    defaultValues: {
      planName: "",
      amount: 0,
    },
  });

  // Preenche o formulário quando os dados da assinatura são carregados
  useEffect(() => {
    if (subscription) {
      form.reset({
        planName: subscription.planName || "",
        amount: subscription.amount || 0,
        status: subscription.status,
      });
    }
  }, [subscription, form]);

  const { mutate: updateSubscription, isPending } = useUpdateSubscription();

  const onSubmit = (data: UpdateSubscriptionFormData) => {
    if (!subscription?.id) return;
    
    updateSubscription({ id: subscription.id, data });
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isPending,
  };
}