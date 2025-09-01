import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { withAuth } from "@/lib/auth-middleware";
import { idParamSchema } from "@/lib/validations/ebook";
import { ApiResponse, UserEbookAccess } from "@/types/api";
import { z } from "zod";

// POST /api/ebooks/[id]/access - Registrar acesso/view do usuário
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = idParamSchema.parse(params);

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
            userId: user.id,
            ebookId: id
          }
        },
        update: {
          lastAccess: new Date()
        },
        create: {
          userId: user.id,
          ebookId: id
        }
      });

      const response: ApiResponse<UserEbookAccess> = {
        success: true,
        data: {
          ...access,
          lastDownload: access.lastDownload?.toISOString() || null,
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

// GET /api/ebooks/[id]/access - Obter dados de acesso do usuário
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = idParamSchema.parse(params);

      const access = await prisma.userEbookAccess.findUnique({
        where: {
          userId_ebookId: {
            userId: user.id,
            ebookId: id
          }
        },
        include: {
          ebook: {
            include: {
              category: true
            }
          }
        }
      });

      if (!access) {
        const response: ApiResponse = {
          success: false,
          data: null,
          error: "Acesso não encontrado"
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: ApiResponse<UserEbookAccess> = {
        success: true,
        data: {
          ...access,
          lastDownload: access.lastDownload?.toISOString() || null,
          firstAccess: access.firstAccess.toISOString(),
          lastAccess: access.lastAccess.toISOString(),
          createdAt: access.createdAt.toISOString(),
          updatedAt: access.updatedAt.toISOString()
        },
        error: null
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error("Erro ao buscar acesso:", error);
      
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