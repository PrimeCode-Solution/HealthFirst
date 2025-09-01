import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { withAuth, checkPremiumAccess } from "@/lib/auth-middleware";
import { ApiResponse, EbookWithAccess } from "@/types/api";

// GET /api/user/ebooks - Ebooks acessados pelo usuário
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const onlyDownloaded = searchParams.get("downloaded") === "true";

      const where: any = {
        userId: user.id
      };

      if (onlyDownloaded) {
        where.downloadCount = { gt: 0 };
      }

      const userAccess = await prisma.userEbookAccess.findMany({
        where,
        include: {
          ebook: {
            include: {
              category: true
            }
          }
        },
        orderBy: { lastAccess: "desc" }
      });

      // Verificar acesso premium
      const hasPremiumAccess = await checkPremiumAccess(user.id);

      const ebooks: EbookWithAccess[] = userAccess.map(access => ({
        ...access.ebook,
        price: access.ebook.price ? Number(access.ebook.price) : null,
        createdAt: access.ebook.createdAt.toISOString(),
        updatedAt: access.ebook.updatedAt.toISOString(),
        category: {
          ...access.ebook.category,
          createdAt: access.ebook.category.createdAt.toISOString(),
          updatedAt: access.ebook.category.updatedAt.toISOString()
        },
        hasAccess: !access.ebook.isPremium || hasPremiumAccess,
        userAccess: {
          ...access,
          lastDownload: access.lastDownload?.toISOString() || null,
          firstAccess: access.firstAccess.toISOString(),
          lastAccess: access.lastAccess.toISOString(),
          createdAt: access.createdAt.toISOString(),
          updatedAt: access.updatedAt.toISOString()
        }
      }));

      const response: ApiResponse<EbookWithAccess[]> = {
        success: true,
        data: ebooks,
        error: null
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error("Erro ao buscar ebooks do usuário:", error);
      
      const response: ApiResponse = {
        success: false,
        data: null,
        error: "Erro interno do servidor"
      };
      return NextResponse.json(response, { status: 500 });
    }
  });
}