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
    queryFn: () => paymentRepository.findAll(),
    enabled: !!userId,
    });
}
