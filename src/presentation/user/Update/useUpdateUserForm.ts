import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserSchema } from "@/lib/validations/user";
import { z } from "zod";
import { useUpdateUserMutation } from "../mutations/useUserMutations";
import { User } from "@/modules/user/domain/user.interface";

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export interface UseUpdateUserFormProps {
  user: User;
  onSuccess?: () => void;
}

export const useUpdateUserForm = ({
  user,
  onSuccess,
}: UseUpdateUserFormProps) => {
  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    },
  });

  useEffect(() => {
    form.reset({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  }, [user, form]);

  const updateMutation = useUpdateUserMutation();

  const handleSubmit = form.handleSubmit(async (data: UpdateUserFormData) => {
    await updateMutation.mutateAsync(
      { id: user.id, data },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
        },
      },
    );
  });

  return {
    form,
    handleSubmit,
    isPending: updateMutation.isPending,
  };
};