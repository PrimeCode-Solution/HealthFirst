import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { CreatePaymentDTO } from "@/modules/payments/domain/payment.interface";
import { PaymentStatus } from "@/modules/payments/domain/payment.interface";

export const schema = z.object({
    appointmentId: z.string().optional(),

    subscriptionId: z.string().optional(),

    mercadoPagoId: z.string().optional(),

    preferenceId: z.string().optional(),

    amount: z
    .number()
    .positive("Valor deve ser maior que zero"),

    currency: z
    .string()
    .min(3, "Moeda deve ter 3 caracteres")
    .max(3, "Moeda deve ter 3 caracteres"),

    description: z
    .string()
    .min(5, "Descrição deve ter pelo menos 5 caracteres")
    .max(200, "Descrição deve ter no máximo 200 caracteres"),

    status: z
    .enum([
        PaymentStatus.PENDING,
        PaymentStatus.APPROVED,
        PaymentStatus.REJECTED,
        PaymentStatus.CANCELLED,
        PaymentStatus.REFUNDED,
        PaymentStatus.IN_PROCESS,
    ])
    .optional(),

    payerEmail: z.string().email("E-mail inválido").optional(),

    payerName: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional(),

    payerPhone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .max(15, "Telefone deve ter no máximo 15 dígitos")
    .optional(),
});

export const usePaymentForm = (
    defaultValues?: Partial<CreatePaymentDTO>,
) => {
    const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    } = useForm<CreatePaymentDTO>({
    resolver: zodResolver(schema),
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
