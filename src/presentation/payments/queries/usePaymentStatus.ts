import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface PaymentStatusResponse {
  status: "PENDING" | "APPROVED" | "REJECTED";
  payerEmail?: string;
  amount: number;
  currency?: string;
  description?: string;
  appointmentId?: string;
}

export function usePaymentStatus(paymentId: string) {
  return useQuery<PaymentStatusResponse>({
    queryKey: ["paymentStatus", paymentId],
    queryFn: async () => {
      const { data } = await api.get(`/payments/status/${paymentId}`);
      return data;
    },
    enabled: !!paymentId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING" ? 3000 : false;
    },
  });
}
