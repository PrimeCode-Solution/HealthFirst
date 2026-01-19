import { z } from "zod";

export const userProfileSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  phone: z.string().min(10, "Telefone inválido."), // URL da imagem
  bio: z.string().optional(),
  specialty: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "A senha atual é obrigatória."),
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter no mínimo 8 caracteres.")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
      .regex(/[^a-zA-Z0-9]/, "A senha deve conter pelo menos um símbolo."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export type UserProfileValues = z.infer<typeof userProfileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;