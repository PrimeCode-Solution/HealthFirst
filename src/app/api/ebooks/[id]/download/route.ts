import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { withAuth, checkPremiumAccess } from "@/lib/auth-middleware";
import { idParamSchema } from "@/lib/validations/ebook";
import { ApiResponse } from "@/types/api";
import { z } from "zod";
import { readFile } from "fs/promises";
import { join } from "path";

// GET /api/ebooks/[id]/download - Download com verificação de acesso premium
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
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

      // Verificar acesso premium se necessário
      if (ebook.isPremium) {
        const hasAccess = await checkPremiumAccess(user.id);
        
        if (!hasAccess) {
          const response: ApiResponse = {
            success: false,
            data: null,
            error: "Acesso premium necessário para este ebook"
          };
          return NextResponse.json(response, { status: 403 });
        }
      }

      // Registrar ou atualizar acesso
      await prisma.userEbookAccess.upsert({
        where: {
          userId_ebookId: {
            userId: user.id,
            ebookId: id
          }
        },
        update: {
          downloadCount: { increment: 1 },
          lastDownload: new Date(),
          lastAccess: new Date()
        },
        create: {
          userId: user.id,
          ebookId: id,
          downloadCount: 1,
          lastDownload: new Date()
        }
      });

      // Incrementar contador global de downloads
      await prisma.ebook.update({
        where: { id },
        data: { downloadCount: { increment: 1 } }
      });

      // Para demonstração, retornar URL de download
      // Em produção, você serviria o arquivo diretamente
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
  });
}