import { useQuery } from "@tanstack/react-query";
import { createUserRepository } from "@/modules/user/infrastructure/userRepository";

export const useUserQueries = () => {
  const userRepository = createUserRepository();

  // Query para verificar se usuário tem acesso premium
  const usePremiumAccess = (userId: string) => {
    return useQuery({
      queryKey: ["user", userId, "premium-access"],
      queryFn: () => userRepository.hasAccessToPremiumContent(userId),
      enabled: !!userId, // Só executa se tiver userId
      staleTime: 2 * 60 * 1000, // 2 minutos (pode ser menos já que consulta no MP)
      retry: 2, // Retry em caso de erro (API externa pode falhar)
    });
  };

  return {
    usePremiumAccess,
  };
};
