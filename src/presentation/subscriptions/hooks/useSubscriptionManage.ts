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
      // Chaves reais usadas pelas queries de assinatura (antes invalidava
      // "user-subscription"/"user-profile", que nenhuma query usa → UI ficava desatualizada).
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions-user"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions-history"] });
    },
    onError: () => {
      toast.error("Erro ao cancelar assinatura.");
    },
  });

  return {
    cancelSubscription,
  };
}