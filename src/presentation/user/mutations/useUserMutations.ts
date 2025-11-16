import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/userService";
import { USER_QUERY_KEYS } from "../queries/useUserQueries";
import { CreateUserDTO, UpdateUserDTO } from "@/modules/user/domain/user.interface";
import { toast } from "sonner";

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserDTO) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.all,
      });
      toast.success("Usuário criado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Falha ao criar usuário.");
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: UpdateUserDTO }) =>
      userService.updateUser(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.detail(variables.id),
      });
      toast.success("Usuário atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Falha ao atualizar usuário.");
    },
  });
};