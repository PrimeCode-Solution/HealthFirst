import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ebookCategoryService } from "../services/ebookCategoryService";
import { EBOOK_CATEGORY_QUERY_KEYS } from "../queries/useEbookCategoryQueries";
import { CreateCategoryDTO, UpdateCategoryDTO } from "@/types/ebook";
import { toast } from "sonner";

export const useCreateEbookCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryDTO) =>
      ebookCategoryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: EBOOK_CATEGORY_QUERY_KEYS.all,
      });
      toast.success("Categoria criada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Falha ao criar categoria.");
    },
  });
};

export const useUpdateEbookCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: UpdateCategoryDTO }) =>
      ebookCategoryService.updateCategory(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: EBOOK_CATEGORY_QUERY_KEYS.all,
      });
      toast.success("Categoria atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Falha ao atualizar categoria.");
    },
  });
};