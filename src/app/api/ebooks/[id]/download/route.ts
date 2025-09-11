import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { idParamSchema } from "@/lib/validations/ebook";
import { ApiResponse } from "@/types/ebook";
import { z } from "zod";

// GET /api/ebooks/[id]/download - Download com verificação de acesso premium
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = idParamSchema.parse(params);

    // Buscar ebook
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

    if (!ebook.isActive) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: "Ebook não está disponível"
      };
      return NextResponse.json(response, { status: 400 });
    }

    // TODO: Verificar acesso premium se necessário
    if (ebook.isPremium) {
      // Aqui seria implementada a verificação de assinatura premium
      // Por enquanto, retornando erro para ebooks premium
      const response: ApiResponse = {
        success: false,
        data: null,
        error: "Acesso premium necessário para este ebook"
      };
      return NextResponse.json(response, { status: 403 });
    }

    // TODO: Registrar download na tabela UserEbookAccess
    // Por enquanto, apenas incrementar contador global
    await prisma.ebook.update({
      where: { id },
      data: { downloadCount: { increment: 1 } }
    });

    // Retornar URL de download
    const response: ApiResponse = {
      success: true,
      data: {
        downloadUrl: ebook.fileUrl,
        filename: `${ebook.title}.${ebook.fileType}`,
        fileSize: ebook.fileSize,
        fileType: ebook.fileType
      },
      error: null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro no download:", error);
    
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