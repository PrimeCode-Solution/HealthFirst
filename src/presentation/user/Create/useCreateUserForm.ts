import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema } from "@/lib/validations/user";
import { z } from "zod";
import { useCreateUserMutation } from "../mutations/useUserMutations";
import { UserRole } from "@/modules/user/domain/user.interface";
import DOMPurify from "dompurify";

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const useCreateUserForm = () => {
  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: UserRole.DOCTOR,
    },
  });

  const createMutation = useCreateUserMutation();

  const handleSubmit = form.handleSubmit(async (data: CreateUserFormData) => {
    const sanitizedData = {
      ...data,
      name: typeof window !== 'undefined' ? DOMPurify.sanitize(data.name) : data.name,
      email: data.email.trim().toLowerCase(),
      };

    await createMutation.mutateAsync(sanitizedData, {
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