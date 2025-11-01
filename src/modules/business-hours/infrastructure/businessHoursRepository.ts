import type {
  BusinessHours,
  CreateBusinessHoursDTO,
  UpdateBusinessHoursDTO,
} from "../domain/businessHours.interface";
import { BusinessHoursRepository } from "../domain/businessHoursRepository";
import api from "@/lib/api";

// Exporta o repositório
export function createBusinessHoursRepository(): BusinessHoursRepository {
  return {
    create,
    findAll,
    findById,
    update,
    delete: deleteCategory,
    getAvailableSlots,
  };
}

// Criação do registro
async function create(data: CreateBusinessHoursDTO): Promise<BusinessHours> {
  const response = await api.post<BusinessHours>("/business-hours", data);
  return response.data;
}

// Buscar todos os registros
async function findAll(): Promise<BusinessHours[]> {
  const response = await api.get<BusinessHours[]>("/business-hours");
  return response.data;
}

// Buscar por id
async function findById(
  id: BusinessHours["id"],
): Promise<BusinessHours | null> {
  const response = await api.get<BusinessHours>(`/business-hours/${id}`);
  return response.data;
}

// Atualizar registro
async function update(
  id: BusinessHours["id"],
  data: Partial<UpdateBusinessHoursDTO>,
): Promise<BusinessHours> {
  const response = await api.patch<BusinessHours>(
    `/business-hours/${id}`,
    data,
  );
  return response.data;
}

// Deletar registro
async function deleteCategory(id: BusinessHours["id"]): Promise<boolean> {
  try {
    await api.delete(`/business-hours/${id}`);
    return true;
  } catch (error) {
    return false;
  }
}

// Busca slots disponíveis para uma data específica
async function getAvailableSlots(
  id: BusinessHours["id"],
  date: Date,
): Promise<string[]> {
  const response = await api.get<string[]>(
    `/business-hours/${id}/available-slots?date=${date.toISOString().slice(0, 10)}`,
  );
  return response.data;
}
