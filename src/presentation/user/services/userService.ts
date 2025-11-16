import api from "@/lib/api";
import {
  User,
  CreateUserDTO,
  UpdateUserDTO,
  ListUsers,
} from "@/modules/user/domain/user.interface";
import { ApiResponse } from "@/types/ebook";

async function listUsers(): Promise<ListUsers> {
  const response = await api.get<ApiResponse<ListUsers>>("/users");
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "Erro ao buscar usuários");
  }
  return response.data.data;
}

async function getUserById(userId: string): Promise<User> {
  const response = await api.get<ApiResponse<User>>(`/users/${userId}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "Erro ao buscar usuário");
  }
  return response.data.data;
}

async function createUser(data: CreateUserDTO): Promise<User> {
  const response = await api.post<ApiResponse<User>>("/users", data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "Erro ao criar usuário");
  }
  return response.data.data;
}

async function updateUser({
  id,
  data,
}: {
  id: string;
  data: UpdateUserDTO;
}): Promise<User> {
  const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "Erro ao atualizar usuário");
  }
  return response.data.data;
}

export const userService = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
};