import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function usePaymentStatus(paymentId: string) {
    return useQuery({
        queryKey: ["paymentStatus", paymentId],
        queryFn: async () => {
            const { data } = await api.get(`/payments/${paymentId}`); 
            return data;
        },
        enabled: !!paymentId,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (status === "CONFIRMED" || status === "CANCELLED" || status === "REJECTED") {
                return false; // Para de atualizar se já finalizou
            }
            return 2000; 
        },
        refetchOnWindowFocus: true,
    });
}