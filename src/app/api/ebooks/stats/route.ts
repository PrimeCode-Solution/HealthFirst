import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { EbookService } from "@/services/ebook.service";
import { ApiResponse } from "@/types/api";

// GET /api/ebooks/stats - Estatísticas dos ebooks (apenas admin)
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, user) => {
    try {
      const stats = await EbookService.getEbookStats();

      const response: ApiResponse = {
        success: true,
        data: stats,
        error: null
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      
      const response: ApiResponse = {
        success: false,
        data: null,
        error: "Erro interno do servidor"
      };
      return NextResponse.json(response, { status: 500 });
    }
  });
}