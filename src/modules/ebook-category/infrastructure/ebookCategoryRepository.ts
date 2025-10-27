import type {
  EbookCategory,
  CreateEbookCategoryDTO,
} from "../domain/ebookCategory.interface";
import { EbookCategoryRepository } from "../domain/ebookCategoryRepository";
import api from "@/lib/api";

export function createEbookCategoryRepository(): EbookCategoryRepository {
  return {
    create,
    findAll,
    findById,
    update,
    delete: deleteCategory,
  };
}

async function create(data: CreateEbookCategoryDTO): Promise<EbookCategory> {
  const response = await api.post<EbookCategory>("/ebook-categories", data);
  return response.data;
}

async function findAll(): Promise<EbookCategory[]> {
  const response = await api.get<EbookCategory[]>("/ebook-categories");
  return response.data;
}

async function findById(
  id: EbookCategory["id"],
): Promise<EbookCategory | null> {
  const response = await api.get<EbookCategory>(`/ebook-categories/${id}`);
  return response.data;
}

async function update(
  id: EbookCategory["id"],
  data: Partial<CreateEbookCategoryDTO>,
): Promise<EbookCategory> {
  const response = await api.patch<EbookCategory>(
    `/ebook-categories/${id}`,
    data,
  );
  return response.data;
}

async function deleteCategory(id: EbookCategory["id"]): Promise<void> {
  await api.delete(`/ebook-categories/${id}`);
}
