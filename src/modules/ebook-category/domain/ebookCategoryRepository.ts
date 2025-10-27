import {
  CreateEbookCategoryDTO,
  EbookCategory,
} from "./ebookCategory.interface";

export interface EbookCategoryRepository {
  create(data: CreateEbookCategoryDTO): Promise<EbookCategory>;
  findAll(): Promise<EbookCategory[]>;
  findById(id: EbookCategory["id"]): Promise<EbookCategory | null>;
  update(
    id: EbookCategory["id"],
    data: Partial<CreateEbookCategoryDTO>,
  ): Promise<EbookCategory>;
  delete(id: EbookCategory["id"]): Promise<void>;
}
