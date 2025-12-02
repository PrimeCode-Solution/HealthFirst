import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/userService";
import { toast } from "sonner";

interface UpdateUserParams {
  userId: string;
  data: any;
}

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: UpdateUserParams) => {
      return await userService.updateUser(userId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
    },
    onError: (error: any) => {
      console.error("Erro no update:", error);
      toast.error("Erro ao atualizar usuário. Tente novamente.");
    },
  });
};