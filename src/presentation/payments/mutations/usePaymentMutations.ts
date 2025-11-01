import {useMutation, useQueryClient} from "@tanstack/react-query";
import { createPaymentRepository } from "@/modules/payments/infrastrutucture/paymentRepository";
import {toast} from "sonner";
import { PaymentStatus, type CreatePaymentDTO } from "@/modules/payments/domain/payment.interface";
import { Axios, AxiosError } from "axios";
import { error } from "console";
import { Payment } from "@/generated/prisma";

const paymentRepository = createPaymentRepository();

export function useCreatePayment(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePaymentDTO) => paymentRepository.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["payments"]});
            toast.success("Pagamento craido com sucesso!");
        },
        onError: (error: AxiosError) => {
            console.error("Error ao criar pagamento: ", error);
            toast.error(error.message || "Erro ao criar pagamento");
        },
    });
}

export function useProcessPayment(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (PaymentId: Payment["id"]) => {
            return paymentRepository.update(PaymentId, {
                status: PaymentStatus.IN_PROCESS,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["payments"]});
            toast.success("Pagamento processado com sucesso!");
        },
        onError: (error: AxiosError) => {
            console.error("Error ao porcessar pagamento: ", error);
            toast.error(error.message || "Erro ao processar pagamento");
        },
    });
}

export function useCancelPayment(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (paymentId: Payment["id"]) => {
            return paymentRepository.update(paymentId, {
                status: PaymentStatus.CANCELLED,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["payments"]});
            toast.success("Pagamento cancelado com sucesso!");
        },
        onError: (error: AxiosError) => {
            console.error("Erro ao cancelar pagamento: ", error);
            toast.error(error.message|| "Erro ao cancelar pagamento");
        },
    });
}

export function useRefundPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (paymentId: Payment["id"]) => {
            return paymentRepository.update(paymentId, {
                status: PaymentStatus.REFUNDED,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey:["payments"]});
            toast.success("Reembolso realizado com sucesso!");
        },
        onError: (error: AxiosError) => {
            console.error("Erro ao porcessar reembolso: ", error);
            toast.error(error.message|| "Erro ao prcessar reembolso")
        },
    });
}