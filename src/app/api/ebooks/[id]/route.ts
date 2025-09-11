import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { updateEbookSchema, idParamSchema } from "@/lib/validations/ebook";
import { ApiResponse, Ebook } from "@/types/ebook";
import { z } from "zod";

// GET /api/ebooks/[id] - Detalhes completos do ebook
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = idParamSchema.parse(params);

    const ebook = await prisma.ebook.findUnique({
      where: { id },
      include: {
        category: true
      }
    });

    if (!ebook) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: "Ebook não encontrado"
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Incrementar view count
    await prisma.ebook.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
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

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao buscar ebook:", error);
    
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

// PUT /api/ebooks/[id] - Editar ebook (apenas admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = idParamSchema.parse(params);

    // Verificar se ebook existe
    const existingEbook = await prisma.ebook.findUnique({
      where: { id }
    });

    if (!existingEbook) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: "Ebook não encontrado"
      };
      return NextResponse.json(response, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateEbookSchema.parse(body);

    // Verificar se categoria existe (se estiver sendo alterada)
    if (validatedData.categoryId) {
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
    }

    const updatedEbook = await prisma.ebook.update({
      where: { id },
      data: validatedData,
      include: {
        category: true
      }
    });

    const response: ApiResponse<Ebook> = {
      success: true,
      data: {
        ...updatedEbook,
        price: updatedEbook.price ? Number(updatedEbook.price) : null,
        createdAt: updatedEbook.createdAt.toISOString(),
        updatedAt: updatedEbook.updatedAt.toISOString(),
        category: {
          ...updatedEbook.category,
          createdAt: updatedEbook.category.createdAt.toISOString(),
          updatedAt: updatedEbook.category.updatedAt.toISOString()
        }
      },
      error: null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao atualizar ebook:", error);
    
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

// DELETE /api/ebooks/[id] - Deletar ebook (apenas admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = idParamSchema.parse(params);

    // Verificar se ebook existe
    const existingEbook = await prisma.ebook.findUnique({
      where: { id }
    });

    if (!existingEbook) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: "Ebook não encontrado"
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Deletar ebook e registros relacionados
    await prisma.ebook.delete({
      where: { id }
    });

    const response: ApiResponse = {
      success: true,
      data: { message: "Ebook deletado com sucesso" },
      error: null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao deletar ebook:", error);
    
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