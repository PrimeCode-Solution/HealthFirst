import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema } from "@/lib/validations/user";
import { z } from "zod";
import { useCreateUserMutation } from "../mutations/useUserMutations";
import { UserRole } from "@/modules/user/domain/user.interface";

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const useCreateUserForm = () => {
  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      clerkId: "",
      name: "",
      email: "",
      phone: "",
      role: UserRole.USER,
    },
  });

  const createMutation = useCreateUserMutation();

  const handleSubmit = form.handleSubmit(async (data: CreateUserFormData) => {
    await createMutation.mutateAsync(data, {
      onSuccess: () => {
        form.reset();
      },
    });
  });

  return {
    form,
    handleSubmit,
    isPending: createMutation.isPending,
  };
};