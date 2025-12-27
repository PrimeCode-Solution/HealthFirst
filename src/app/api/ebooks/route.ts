import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { ApiResponse, Ebook } from "@/types/ebook";
import { formatISO } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryName = searchParams.get("category");

    const ebooks = await prisma.ebook.findMany({
      where: categoryName
        ? {
            category: {
              name: categoryName,
            },
          }
        : {},
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    type EbookWithCategory = (typeof ebooks)[number];

    const data: Ebook[] = ebooks.map((ebook: EbookWithCategory) => ({
      id: ebook.id,
      title: ebook.title,
      description: ebook.description ?? undefined,
      author: ebook.author,
      coverUrl: ebook.coverImage ?? undefined, // mapeia para o nome usado no front
      downloadUrl: ebook.fileUrl, // mapeia para o nome usado no front
      isPremium: ebook.isPremium,
      price: ebook.price ? Number(ebook.price) : undefined,
      categoryId: ebook.categoryId,
      fileSize: ebook.fileSize ?? undefined,
      fileType: ebook.fileType,
      isActive: ebook.isActive,
      downloadCount: ebook.downloadCount,
      viewCount: ebook.viewCount,
      createdAt: formatISO(ebook.createdAt),
      updatedAt: formatISO(ebook.updatedAt),
      category: {
        id: ebook.category.id,
        name: ebook.category.name,
        description: ebook.category.description ?? undefined,
        createdAt: formatISO(ebook.category.createdAt),
        updatedAt: formatISO(ebook.category.updatedAt),
      },
    }));

    const response: ApiResponse<Ebook[]> = {
      success: true,
      data,
      error: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao listar ebooks:", error);

    const response: ApiResponse = {
      success: false,
      data: null,
      error: "Erro interno do servidor",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
