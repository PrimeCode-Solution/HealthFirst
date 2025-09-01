import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { withAuth, withAdminAuth, checkPremiumAccess } from "@/lib/auth-middleware";
import { createEbookSchema, ebookFiltersSchema } from "@/lib/validations/ebook";
import { handleFileUpload } from "@/lib/file-upload";
import { ApiResponse, Ebook, EbookWithAccess, PaginatedResponse } from "@/types/api";
import { z } from "zod";

// GET /api/ebooks - Listar ebooks com filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = ebookFiltersSchema.parse({
      categoryId: searchParams.get("categoryId") || undefined,
      isPremium: searchParams.get("isPremium") === "true" ? true : 
                 searchParams.get("isPremium") === "false" ? false : undefined,
      isActive: searchParams.get("isActive") === "true" ? true :
                searchParams.get("isActive") === "false" ? false : undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10")
    });

    // Construir where clause
    const where: any = {};
    
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    
    if (filters.isPremium !== undefined) {
      where.isPremium = filters.isPremium;
    }
    
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { author: { contains: filters.search, mode: "insensitive" } }
      ];
    }

    // Calcular offset
    const offset = (filters.page - 1) * filters.limit;

    // Buscar ebooks com paginação
    const [ebooks, total] = await Promise.all([
      prisma.ebook.findMany({
        where,
        include: {
          category: true
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: filters.limit
      }),
      prisma.ebook.count({ where })
    ]);

    const totalPages = Math.ceil(total / filters.limit);

    const response: ApiResponse<PaginatedResponse<Ebook>> = {
      success: true,
      data: {
        items: ebooks.map(ebook => ({
          ...ebook,
          price: ebook.price ? Number(ebook.price) : null,
          createdAt: ebook.createdAt.toISOString(),
          updatedAt: ebook.updatedAt.toISOString(),
          category: {
            ...ebook.category,
            createdAt: ebook.category.createdAt.toISOString(),
            updatedAt: ebook.category.updatedAt.toISOString()
          }
        })),
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages
      },
      error: null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao buscar ebooks:", error);
    
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: error.errors[0].message
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: ApiResponse = {
      success: false,
      data: null,
      error: "Erro interno do servidor"
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/ebooks - Upload de ebook (apenas admin)
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, user) => {
    try {
      // Upload de arquivos
      const coverUpload = await handleFileUpload(
        req, 
        "coverImage", 
        ["image/jpeg", "image/png", "image/webp"],
        5 * 1024 * 1024 // 5MB para imagens
      );

      const ebookUpload = await handleFileUpload(
        req,
        "ebookFile",
        ["application/pdf", "application/epub+zip", "application/x-mobipocket-ebook"],
        50 * 1024 * 1024 // 50MB para ebooks
      );

      if (!ebookUpload) {
        const response: ApiResponse = {
          success: false,
          data: null,
          error: "Arquivo do ebook é obrigatório"
        };
        return NextResponse.json(response, { status: 400 });
      }

      // Obter dados do formulário
      const formData = await req.formData();
      const ebookData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string || undefined,
        author: formData.get("author") as string,
        categoryId: formData.get("categoryId") as string,
        isPremium: formData.get("isPremium") === "true",
        price: formData.get("price") ? parseFloat(formData.get("price") as string) : undefined,
        fileType: ebookUpload.type === "application/pdf" ? "pdf" : 
                  ebookUpload.type === "application/epub+zip" ? "epub" : "mobi"
      };

      const validatedData = createEbookSchema.parse(ebookData);

      // Verificar se categoria existe
      const category = await prisma.ebookCategory.findUnique({
        where: { id: validatedData.categoryId }
      });

      if (!category) {
        const response: ApiResponse = {
          success: false,
          data: null,
          error: "Categoria não encontrada"
        };
        return NextResponse.json(response, { status: 400 });
      }

      // Criar ebook
      const ebook = await prisma.ebook.create({
        data: {
          ...validatedData,
          coverImage: coverUpload?.url,
          fileUrl: ebookUpload.url,
          fileSize: ebookUpload.size,
          fileType: validatedData.fileType
        },
        include: {
          category: true
        }
      });

      const response: ApiResponse<Ebook> = {
        success: true,
        data: {
          ...ebook,
          price: ebook.price ? Number(ebook.price) : null,
          createdAt: ebook.createdAt.toISOString(),
          updatedAt: ebook.updatedAt.toISOString(),
          category: {
            ...ebook.category,
            createdAt: ebook.category.createdAt.toISOString(),
            updatedAt: ebook.category.updatedAt.toISOString()
          }
        },
        error: null
      };

      return NextResponse.json(response, { status: 201 });
    } catch (error) {
      console.error("Erro ao criar ebook:", error);
      
      if (error instanceof z.ZodError) {
        const response: ApiResponse = {
          success: false,
          data: null,
          error: error.errors[0].message
        };
        return NextResponse.json(response, { status: 400 });
      }

      const response: ApiResponse = {
        success: false,
        data: null,
        error: "Erro interno do servidor"
      };
      return NextResponse.json(response, { status: 500 });
    }
  });
}