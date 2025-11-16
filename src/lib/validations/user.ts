import { z } from "zod";
import { UserRole } from "@/modules/user/domain/user.interface";

export const createUserSchema = z.object({
  clerkId: z.string().min(1, "Clerk ID é obrigatório"),
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z
    .string()
    .email("Por favor, insira um e-mail válido"),
  phone: z
    .string()
    .min(10, "O telefone deve ter pelo menos 10 caracteres")
    .optional()
    .or(z.literal("")),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
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
    .min(10, "O telefone deve ter pelo menos 10 caracteres")
    .optional()
    .or(z.literal("")),
});