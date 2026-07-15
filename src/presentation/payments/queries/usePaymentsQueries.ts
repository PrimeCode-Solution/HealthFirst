import { useQuery } from "@tanstack/react-query";
import { createPaymentRepository } from "@/modules/payments/infrastrutucture/paymentRepository";

const paymentRepository = createPaymentRepository();

export function usePayments() {
    return useQuery({
    queryKey: ["payments"],
    queryFn: () => paymentRepository.findAll(),
    });
}

export function usePaymentById(id: string) {
    return useQuery({
    queryKey: ["payment", id],
    queryFn: () => paymentRepository.findById(id),
    enabled: !!id,
    });
}

export function useUserPayments(userId: string) {
    return useQuery({
    queryKey: ["userPayments", userId],
    // ATENÇÃO: findAll() ignora o userId e retorna TODOS os pagamentos. Não existe
    // endpoint de pagamentos por usuário no backend (/api/payments só tem [id]).
    // Não use este hook para exibir dados sensíveis até haver um endpoint filtrado.
    queryFn: () => paymentRepository.findAll(),
    enabled: !!userId,
    });
}
