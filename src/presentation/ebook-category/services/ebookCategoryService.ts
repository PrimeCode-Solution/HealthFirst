import api from "@/lib/api";
import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  EbookCategory,
} from "@/types/ebook";
import { ApiResponse } from "@/types/ebook";

async function createCategory(
  data: CreateCategoryDTO,
): Promise<EbookCategory> {
  const response = await api.post<ApiResponse<EbookCategory>>(
    "/ebook-categories",
    data,
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "Erro ao criar categoria");
  }
  return response.data.data;
}

async function updateCategory({
  id,
  data,
}: {
  id: string;
  data: UpdateCategoryDTO;
}): Promise<EbookCategory> {
  const response = await api.put<ApiResponse<EbookCategory>>(
    `/ebook-categories/${id}`,
    data,
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "Erro ao atualizar categoria");
  }
  return response.data.data;
}

async function getCategories(): Promise<EbookCategory[]> {
  const response = await api.get<ApiResponse<EbookCategory[]>>(
    "/ebook-categories",
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "Erro ao buscar categorias");
  }
  return response.data.data;
}

export const ebookCategoryService = {
  createCategory,
  updateCategory,
  getCategories,
};