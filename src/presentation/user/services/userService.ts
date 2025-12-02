import api from "@/lib/api";
import { User } from "@/modules/user/domain/user.interface";

interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
}

export const userService = {
  // Buscar usuário pelo ID
  getUserById: async (userId: string): Promise<User> => {
    const { data } = await api.get(`/users/${userId}`);
    return data;
  },

  updateUser: async (userId: string, userData: UpdateUserDto): Promise<User> => {
    const { data } = await api.put(`/users/${userId}`, userData);
    return data;
  },
};