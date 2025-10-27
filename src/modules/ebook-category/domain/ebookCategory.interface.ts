export interface EbookCategory {
  id: string;
  name: string;
  description?: string;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum CategoryStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface CreateEbookCategoryDTO {
  name: string;
  description?: string;
  status?: CategoryStatus;
}
