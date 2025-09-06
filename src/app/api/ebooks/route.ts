import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { createEbookSchema, ebookFiltersSchema } from "@/lib/validations/ebook";
import { ApiResponse, Ebook } from "@/types/ebook";
import { z } from "zod";

// GET /api/ebooks - Listar ebooks com filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = ebookFiltersSchema.parse({
      categoryId: searchParams.get("categoryId") || undefined,
      isPremium: searchParams.get("isPremium") === "true" ? true : 
                 searchParams.get("isPremium") === "false" ? false : undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10")
    });

    // Construir where clause
    const where: any = { isActive: true };
    
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    
    if (filters.isPremium !== undefined) {
      where.isPremium = filters.isPremium;
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

    const response: ApiResponse = {
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
  try {
    const formData = await request.formData();
    
    // Extrair dados do formulário
    const ebookData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || undefined,
      author: formData.get("author") as string,
      categoryId: formData.get("categoryId") as string,
      isPremium: formData.get("isPremium") === "true",
      price: formData.get("price") ? parseFloat(formData.get("price") as string) : undefined,
      fileType: "pdf" as const // Simplificado para demo
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

    // Processar upload de arquivos (simplificado)
    const coverFile = formData.get("coverImage") as File;
    const ebookFile = formData.get("ebookFile") as File;

    if (!ebookFile) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: "Arquivo do ebook é obrigatório"
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Criar ebook
    const ebook = await prisma.ebook.create({
      data: {
        ...validatedData,
        coverImage: coverFile ? `/uploads/covers/${Date.now()}-${coverFile.name}` : null,
        fileUrl: `/uploads/ebooks/${Date.now()}-${ebookFile.name}`,
        fileSize: ebookFile.size,
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
}