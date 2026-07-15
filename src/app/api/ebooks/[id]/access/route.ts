import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { idParamSchema } from "@/lib/validations/ebook";
import { ApiResponse, UserEbookAccess } from "@/types/ebook";
import { getSessionUser } from "@/lib/auth-guards";
import { z } from "zod";

// POST /api/ebooks/[id]/access - Registrar acesso/view do usuário
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = idParamSchema.parse(params);

    // Identidade vem SEMPRE da sessão. Confiar num userId do body permitiria
    // forjar registros de acesso/analytics em nome de outros usuários.
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        data: null,
        error: "Usuário não autenticado"
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Verificar se ebook existe
    const ebook = await prisma.ebook.findUnique({
      where: { id }
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

    // Registrar ou atualizar acesso
    const access = await prisma.userEbookAccess.upsert({
      where: {
        userId_ebookId: {
          userId: userId,
          ebookId: id
        }
      },
      update: {
        lastAccess: new Date()
      },
      create: {
        userId: userId,
        ebookId: id
      }
    });

    const response: ApiResponse<UserEbookAccess> = {
      success: true,
      data: {
        ...access,
        lastDownload: access.lastDownload?.toISOString() || undefined,
        firstAccess: access.firstAccess.toISOString(),
        lastAccess: access.lastAccess.toISOString(),
        createdAt: access.createdAt.toISOString(),
        updatedAt: access.updatedAt.toISOString()
      },
      error: null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao registrar acesso:", error);
    
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