import { useQuery } from "@tanstack/react-query";
import { createUserRepository } from "@/modules/user/infrastructure/userRepository";
import { userService } from "../services/userService";

export const USER_QUERY_KEYS = {
  all: ["users"] as const,
  lists: () => [...USER_QUERY_KEYS.all, "list"] as const,
  details: () => [...USER_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...USER_QUERY_KEYS.details(), id] as const,
  premium: (id: string) =>
    [...USER_QUERY_KEYS.detail(id), "premium-access"] as const,
};

export const useUserQueries = () => {
  const userRepository = createUserRepository();

  const usePremiumAccess = (userId: string) => {
    return useQuery({
      queryKey: USER_QUERY_KEYS.premium(userId),
      queryFn: () => userRepository.hasAccessToPremiumContent(userId),
      enabled: !!userId,
      staleTime: 2 * 60 * 1000,
      retry: 2,
    });
  };

  const useListUsers = () => {
    return useQuery({
      queryKey: USER_QUERY_KEYS.lists(),
      queryFn: userService.listUsers,
    });
  };

  const useGetUserById = (userId: string) => {
    return useQuery({
      queryKey: USER_QUERY_KEYS.detail(userId),
      queryFn: () => userService.getUserById(userId),
      enabled: !!userId,
    });
  };

  return {
    usePremiumAccess,
    useListUsers,
    useGetUserById,
  };
};