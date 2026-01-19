import { z } from "zod";
import { UserRole } from "@/modules/user/domain/user.interface";


export const createUserSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z
    .string()
    .email("Por favor, insira um e-mail válido"),
  phone: z
    .string()
    .min(1, "O telefone é obrigatório")
    .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, "Número de WhatsApp inválido"),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres"),
  role: z.nativeEnum(UserRole), 
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .optional(),
  email: z
    .string()
    .email("Por favor, insira um e-mail válido")
    .optional(),
  phone: z
    .string()
    .min(14, "Telefone incompleto")
    .optional(), 
});


export const userProfileSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  phone: z.string().min(10, "Telefone inválido."),
  image: z.string().optional(), 
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


export type CreateUserValues = z.infer<typeof createUserSchema>;
export type UpdateUserValues = z.infer<typeof updateUserSchema>;
export type UserProfileValues = z.infer<typeof userProfileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;