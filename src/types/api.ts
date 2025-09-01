// Base API Response
export interface ApiResponse<T = any> {
    success: boolean;
    data: T | null;
    error: string | null;
  }
  
  // Pagination
  export interface PaginationParams {
    page?: number;
    limit?: number;
  }
  
  export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
  // Ebook Types
  export interface Ebook {
    id: string;
    title: string;
    description: string | null;
    author: string;
    coverImage: string | null;
    fileUrl: string;
    isPremium: boolean;
    price: number | null;
    categoryId: string;
    fileSize: number | null;
    fileType: string;
    isActive: boolean;
    downloadCount: number;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    category: EbookCategory;
  }
  
  export interface EbookWithAccess extends Ebook {
    hasAccess: boolean;
    userAccess?: UserEbookAccess;
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
  
  // Category Types
  export interface EbookCategory {
    id: string;
    name: string;
    description: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
    _count?: {
      ebooks: number;
    };
  }
  
  export interface CreateCategoryDTO {
    name: string;
    description?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }
  
  export interface UpdateCategoryDTO {
    name?: string;
    description?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }
  
  // User Ebook Access Types
  export interface UserEbookAccess {
    id: string;
    userId: string;
    ebookId: string;
    downloadCount: number;
    lastDownload: string | null;
    firstAccess: string;
    lastAccess: string;
    createdAt: string;
    updatedAt: string;
  }
  
  // Filter Types
  export interface EbookFilters {
    categoryId?: string;
    isPremium?: boolean;
    isActive?: boolean;
    search?: string;
  }
  
  // Upload Types
  export interface FileUploadResult {
    url: string;
    filename: string;
    size: number;
    type: string;
  }
  
  // Auth Types
  export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER';
  }
  
  // Error Types
  export interface ApiError {
    message: string;
    code?: string;
    statusCode: number;
  }