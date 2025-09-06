import { z } from "zod";

// Schema para criação de categoria
export const createCategorySchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  description: z.string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional()
});

// Schema para atualização de categoria
export const updateCategorySchema = createCategorySchema.partial();

// Schema para criação de ebook
export const createEbookSchema = z.object({
  title: z.string()
    .min(1, "Título é obrigatório")
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  description: z.string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional(),
  author: z.string()
    .min(1, "Autor é obrigatório")
    .min(2, "Nome do autor deve ter pelo menos 2 caracteres")
    .max(100, "Nome do autor deve ter no máximo 100 caracteres"),
  categoryId: z.string()
    .min(1, "Categoria é obrigatória"),
  isPremium: z.boolean().default(false),
  price: z.number()
    .min(0, "Preço deve ser maior ou igual a 0")
    .max(9999.99, "Preço deve ser menor que R$ 10.000")
    .optional(),
  fileType: z.enum(["pdf", "epub", "mobi"])
}).refine(
  (data) => {
    if (data.isPremium && (!data.price || data.price <= 0)) {
      return false;
    }
    return true;
  },
  {
    message: "Ebooks premium devem ter um preço válido",
    path: ["price"]
  }
);

// Schema para atualização de ebook
export const updateEbookSchema = createEbookSchema.partial().extend({
  isActive: z.boolean().optional()
});

// Schema para filtros de ebook
export const ebookFiltersSchema = z.object({
  categoryId: z.string().optional(),
  isPremium: z.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
});

// Schema para parâmetros de ID
export const idParamSchema = z.object({
  id: z.string().min(1, "ID é obrigatório")
});