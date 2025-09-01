import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  ApiResponse, 
  Ebook, 
  EbookWithAccess, 
  EbookCategory, 
  PaginatedResponse,
  CreateEbookDTO,
  UpdateEbookDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  EbookFilters
} from "@/types/api";
import { toast } from "sonner";

// Hooks para Categorias
export const useEbookCategories = (includeInactive = false) => {
  return useQuery({
    queryKey: ["ebook-categories", includeInactive],
    queryFn: async () => {
      const response = await api.get<ApiResponse<EbookCategory[]>>(
        `/ebook-categories?includeInactive=${includeInactive}`
      );
      return response.data.data;
    }
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCategoryDTO) => {
      const response = await api.post<ApiResponse<EbookCategory>>("/ebook-categories", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebook-categories"] });
      toast.success("Categoria criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar categoria");
    }
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryDTO }) => {
      const response = await api.put<ApiResponse<EbookCategory>>(`/ebook-categories/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebook-categories"] });
      toast.success("Categoria atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar categoria");
    }
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<ApiResponse>(`/ebook-categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebook-categories"] });
      toast.success("Categoria deletada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar categoria");
    }
  });
};

// Hooks para Ebooks
export const useEbooks = (filters: EbookFilters & { page?: number; limit?: number } = {}) => {
  const queryParams = new URLSearchParams();
  
  if (filters.categoryId) queryParams.set("categoryId", filters.categoryId);
  if (filters.isPremium !== undefined) queryParams.set("isPremium", filters.isPremium.toString());
  if (filters.isActive !== undefined) queryParams.set("isActive", filters.isActive.toString());
  if (filters.search) queryParams.set("search", filters.search);
  if (filters.page) queryParams.set("page", filters.page.toString());
  if (filters.limit) queryParams.set("limit", filters.limit.toString());

  return useQuery({
    queryKey: ["ebooks", filters],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginatedResponse<EbookWithAccess>>>(
        `/ebooks?${queryParams.toString()}`
      );
      return response.data.data;
    }
  });
};

export const useEbook = (id: string) => {
  return useQuery({
    queryKey: ["ebook", id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<EbookWithAccess>>(`/ebooks/${id}`);
      return response.data.data;
    },
    enabled: !!id
  });
};

export const useCreateEbook = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post<ApiResponse<Ebook>>("/ebooks", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebooks"] });
      toast.success("Ebook criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar ebook");
    }
  });
};

export const useUpdateEbook = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData | UpdateEbookDTO }) => {
      const response = await api.put<ApiResponse<Ebook>>(`/ebooks/${id}`, data, {
        headers: data instanceof FormData ? {
          "Content-Type": "multipart/form-data"
        } : undefined
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ebooks"] });
      queryClient.invalidateQueries({ queryKey: ["ebook", variables.id] });
      toast.success("Ebook atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar ebook");
    }
  });
};

export const useDeleteEbook = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<ApiResponse>(`/ebooks/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebooks"] });
      toast.success("Ebook deletado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar ebook");
    }
  });
};

// Hooks para Downloads e Acesso
export const useDownloadEbook = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.get<ApiResponse>(`/ebooks/${id}/download`);
      return response.data.data;
    },
    onSuccess: (data) => {
      if (data?.downloadUrl) {
        // Abrir download em nova aba
        window.open(data.downloadUrl, "_blank");
      }
      toast.success("Download iniciado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro no download");
    }
  });
};

export const useRecordAccess = () => {
  return useMutation({
    mutationFn: async (ebookId: string) => {
      const response = await api.post<ApiResponse>(`/ebooks/${ebookId}/access`);
      return response.data.data;
    }
  });
};

export const useUserEbooks = (downloaded = false) => {
  return useQuery({
    queryKey: ["user-ebooks", downloaded],
    queryFn: async () => {
      const response = await api.get<ApiResponse<EbookWithAccess[]>>(
        `/user/ebooks?downloaded=${downloaded}`
      );
      return response.data.data;
    }
  });
};

export const useEbookStats = () => {
  return useQuery({
    queryKey: ["ebook-stats"],
    queryFn: async () => {
      const response = await api.get<ApiResponse>("/ebooks/stats");
      return response.data.data;
    }
  });
};