import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { createCategorySchema } from "@/lib/validations/ebook";
import { ApiResponse, EbookCategory } from "@/types/ebook";
import { z } from "zod";

// GET /api/ebook-categories - Listar todas as categorias (público)
export async function GET() {
  try {
    const categories = await prisma.ebookCategory.findMany({
      include: {
        _count: {
          select: {
            ebooks: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });

    const response: ApiResponse<EbookCategory[]> = {
      success: true,
      data: categories.map(cat => ({
        ...cat,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt.toISOString()
      })),
      error: null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    const response: ApiResponse = {
      success: false,
      data: null,
      error: "Erro interno do servidor"
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/ebook-categories - Criar categoria (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // Verificar se categoria já existe
    const existingCategory = await prisma.ebookCategory.findUnique({
      where: { name: validatedData.name }
    });

    if (existingCategory) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: "Categoria com este nome já existe"
      };
      return NextResponse.json(response, { status: 400 });
    }

    const category = await prisma.ebookCategory.create({
      data: validatedData,
      include: {
        _count: {
          select: { ebooks: true }
        }
      }
    });

    const response: ApiResponse<EbookCategory> = {
      success: true,
      data: {
        ...category,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString()
      },
      error: null
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    
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