import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCategorySchema,
} from "@/lib/validations/ebook";
import { z } from "zod";
import { useCreateEbookCategoryMutation } from "../mutations/useEbookCategoryMutations";

export type CreateEbookCategoryFormData = z.infer<typeof createCategorySchema>;

export const useCreateEbookCategoryForm = () => {
  const form = useForm<CreateEbookCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createMutation = useCreateEbookCategoryMutation();

  const handleSubmit = form.handleSubmit(
    async (data: CreateEbookCategoryFormData) => {
      await createMutation.mutateAsync(data, {
        onSuccess: () => {
          form.reset();
        },
      });
    },
  );

  return {
    form,
    handleSubmit,
    isPending: createMutation.isPending,
  };
};