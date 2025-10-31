import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { CreateSubscriptionDTO } from "@/modules/subscriptons/domain/subscription.interface"
import { SubscriptionStatus } from "@/modules/subscriptons/domain/subscription.interface" // ou do prisma, conforme o projeto

export const subscriptionSchema = z.object({
    userId: z.string().min(1, "Usuário é obrigatório"),
    mercadoPagoId: z.string().optional(),
    preapprovalId: z.string().min(1, "Preapproval é obrigatório"),
    planName: z.string().min(2, "Plano precisa ter pelo menos 2 caracteres").optional(),
    amount: z.number().positive("O valor precisa ser positivo").optional(),
    currency: z.string().min(1, "Moeda é obrigatória"),
    status: z.enum(SubscriptionStatus).optional(),
});

export const useSubscriptionForm = (
    defaultValues?: Partial<CreateSubscriptionDTO>,
) => {
    const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    } = useForm<CreateSubscriptionDTO>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues,
    });

    return {
    register,
    handleSubmit,
    errors,
    reset,
    isSubmitting,
    control,
    };
};
