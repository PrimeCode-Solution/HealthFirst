// Tipos para o módulo de Ebooks

export interface EbookCategory {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Ebook {
    id: string;
    title: string;
    description?: string;
    author: string;
    coverImage?: string;
    fileUrl: string;
    isPremium: boolean;
    price?: number;
    categoryId: string;
    fileSize?: number;
    fileType: string;
    isActive: boolean;
    downloadCount: number;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    category: EbookCategory;
  }
  
  export interface UserEbookAccess {
    id: string;
    userId: string;
    ebookId: string;
    downloadCount: number;
    lastDownload?: string;
    firstAccess: string;
    lastAccess: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ApiResponse<T = any> {
    success: boolean;
    data: T | null;
    error: string | null;
  }
  
  export interface CreateCategoryDTO {
    name: string;
    description?: string;
  }
  
  export interface UpdateCategoryDTO {
    name?: string;
    description?: string;
  }
  
  export interface CreateEbookDTO {
    title: string;
    description?: string;
    author: string;
    categoryId: string;
    isPremium: boolean;
    price?: number;
    fileType: string;
  }
  
  export interface UpdateEbookDTO {
    title?: string;
    description?: string;
    author?: string;
    categoryId?: string;
    isPremium?: boolean;
    price?: number;
    isActive?: boolean;
  }
  
  export interface EbookFilters {
    categoryId?: string;
    isPremium?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }