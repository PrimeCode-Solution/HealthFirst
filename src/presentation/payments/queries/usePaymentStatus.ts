import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function usePaymentStatus(paymentId: string | null) {
    return useQuery({
        queryKey: ["paymentStatus", paymentId],
        queryFn: async () => {
            const { data } = await api.get(`/payments/${paymentId}/status`);
            return data;
        },
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data) return 1000;
            
            if (data.status === "PENDING") {
                return 3000;
            }
            return false;
        },
        enabled: !!paymentId,
    });
}
