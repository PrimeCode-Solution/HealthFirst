import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { DashboardStats } from "@/types/dashboard";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await api.get<DashboardStats>("/dashboard/stats");
      return response.data;
    },
    // Atualiza a cada 5 minutos para não sobrecarregar o banco
    staleTime: 1000 * 60 * 5, 
  });
}