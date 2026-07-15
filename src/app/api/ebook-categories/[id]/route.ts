import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { updateCategorySchema, idParamSchema } from "@/lib/validations/ebook";
import { ApiResponse, EbookCategory } from "@/types/ebook";
import { requireAdmin } from "@/lib/auth-guards";
import { z } from "zod";

// PUT /api/ebook-categories/[id] - Editar categoria (apenas admin)
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, data: null, error: "Acesso negado." },
        { status: 403 }
      );
    }

    const params = await props.params;
    const { id } = idParamSchema.parse(params);
    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    const existingCategory = await prisma.ebookCategory.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: "Categoria não encontrada"
      };
      return NextResponse.json(response, { status: 404 });
    }

    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameExists = await prisma.ebookCategory.findUnique({
        where: { name: validatedData.name }
      });

      if (nameExists) {
        const response: ApiResponse = {
          success: false,
          data: null,
          error: "Categoria com este nome já existe"
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    const updatedCategory = await prisma.ebookCategory.update({
      where: { id },
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
        id: updatedCategory.id,
        name: updatedCategory.name,
        description: updatedCategory.description ?? undefined,
        createdAt: updatedCategory.createdAt.toISOString(),
        updatedAt: updatedCategory.updatedAt.toISOString()
      },
      error: null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: error.issues[0].message // <--- CORREÇÃO AQUI (.issues em vez de .errors)
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

// DELETE /api/ebook-categories/[id] - Deletar categoria (apenas admin)
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, data: null, error: "Acesso negado." },
        { status: 403 }
      );
    }

    const params = await props.params;
    const { id } = idParamSchema.parse(params);

    const existingCategory = await prisma.ebookCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { ebooks: true }
        }
      }
    });

    if (!existingCategory) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: "Categoria não encontrada"
      };
      return NextResponse.json(response, { status: 404 });
    }

    if (existingCategory._count.ebooks > 0) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: "Não é possível deletar categoria com ebooks associados"
      };
      return NextResponse.json(response, { status: 400 });
    }

    await prisma.ebookCategory.delete({
      where: { id }
    });

    const response: ApiResponse = {
      success: true,
      data: { message: "Categoria deletada com sucesso" },
      error: null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);
    
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: error.issues[0].message // <--- CORREÇÃO AQUI (.issues em vez de .errors)
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