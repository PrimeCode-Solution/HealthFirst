import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateCategorySchema,
} from "@/lib/validations/ebook";
import { z } from "zod";
import { useUpdateEbookCategoryMutation } from "../mutations/useEbookCategoryMutations";
import { EbookCategory } from "@/types/ebook";

export type UpdateEbookCategoryFormData = z.infer<typeof updateCategorySchema>;

export interface UseUpdateEbookCategoryFormProps {
  category: EbookCategory;
  onSuccess?: () => void;
}

export const useUpdateEbookCategoryForm = ({
  category,
  onSuccess,
}: UseUpdateEbookCategoryFormProps) => {
  const form = useForm<UpdateEbookCategoryFormData>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      name: category.name || "",
      description: category.description || "",
    },
  });

  useEffect(() => {
    form.reset({
      name: category.name || "",
      description: category.description || "",
    });
  }, [category, form]);

  const updateMutation = useUpdateEbookCategoryMutation();

  const handleSubmit = form.handleSubmit(
    async (data: UpdateEbookCategoryFormData) => {
      await updateMutation.mutateAsync(
        { id: category.id, data },
        {
          onSuccess: () => {
            if (onSuccess) onSuccess();
          },
        },
      );
    },
  );

  return {
    form,
    handleSubmit,
    isPending: updateMutation.isPending,
  };
};