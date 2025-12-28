import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export function useSubscriptionManage() {
  const queryClient = useQueryClient();

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const response = await api.post("/subscriptions/cancel");
      return response.data;
    },
    onSuccess: () => {
      toast.success("Assinatura cancelada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: () => {
      toast.error("Erro ao cancelar assinatura.");
    },
  });

  return {
    cancelSubscription,
  };
}