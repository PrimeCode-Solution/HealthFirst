import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { updateEbookSchema, idParamSchema } from "@/lib/validations/ebook";
import { ApiResponse, Ebook } from "@/types/ebook";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

// GET /api/ebooks/[id] - Detalhes completos do ebook
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
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
        id: ebook.id,
        title: ebook.title,
        description: ebook.description ?? undefined, // Converte null para undefined
        author: ebook.author,
        coverImage: ebook.coverImage ?? undefined,
        fileUrl: ebook.fileUrl,
        isPremium: ebook.isPremium,
        price: ebook.price ? Number(ebook.price) : undefined, // Converte Decimal para number
        categoryId: ebook.categoryId,
        fileSize: ebook.fileSize ?? undefined,
        fileType: ebook.fileType,
        isActive: ebook.isActive,
        downloadCount: ebook.downloadCount,
        viewCount: ebook.viewCount,
        createdAt: ebook.createdAt.toISOString(),
        updatedAt: ebook.updatedAt.toISOString(),
        category: {
          id: ebook.category.id,
          name: ebook.category.name,
          description: ebook.category.description ?? undefined, // Converte null para undefined na categoria
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
        error: error.issues[0].message // .issues em vez de .errors
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
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const params = await props.params;
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
        id: updatedEbook.id,
        title: updatedEbook.title,
        description: updatedEbook.description ?? undefined,
        author: updatedEbook.author,
        coverImage: updatedEbook.coverImage ?? undefined,
        fileUrl: updatedEbook.fileUrl,
        isPremium: updatedEbook.isPremium,
        price: updatedEbook.price ? Number(updatedEbook.price) : undefined,
        categoryId: updatedEbook.categoryId,
        fileSize: updatedEbook.fileSize ?? undefined,
        fileType: updatedEbook.fileType,
        isActive: updatedEbook.isActive,
        downloadCount: updatedEbook.downloadCount,
        viewCount: updatedEbook.viewCount,
        createdAt: updatedEbook.createdAt.toISOString(),
        updatedAt: updatedEbook.updatedAt.toISOString(),
        category: {
          id: updatedEbook.category.id,
          name: updatedEbook.category.name,
          description: updatedEbook.category.description ?? undefined,
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
        error: error.issues[0].message
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
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const params = await props.params;
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
      data: { message: "Ebook deletado com sucesso" } as any,
      error: null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao deletar ebook:", error);
    
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: error.issues[0].message
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