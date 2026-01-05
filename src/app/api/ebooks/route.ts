import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { formatISO } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryName = searchParams.get("category");

    const ebooks = await prisma.ebook.findMany({
      where: categoryName
        ? { category: { name: categoryName } }
        : {},
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    const data = ebooks.map((ebook) => ({
      id: ebook.id,
      title: ebook.title,
      description: ebook.description ?? undefined,
      author: ebook.author,
      coverUrl: ebook.coverImage ?? undefined,
      downloadUrl: ebook.fileUrl,
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

    return NextResponse.json({ success: true, data, error: null });
  } catch (error) {
    console.error("Erro ao listar ebooks:", error);
    return NextResponse.json({ success: false, data: null, error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      title, 
      description, 
      categoryId, 
      isPremium, 
      author, 
      price, 
      fileUrl,    
      coverUrl,   
      fileSize,
      fileType 
    } = body;

    if (!fileUrl) {
      return NextResponse.json({ success: false, error: "URL do ebook é obrigatória" }, { status: 400 });
    }

    const newEbook = await prisma.ebook.create({
      data: {
        title,
        description,
        author,
        categoryId,
        isPremium: Boolean(isPremium), 
        price: price ? Number(price) : null,
        fileUrl,
        coverImage: coverUrl || null, 
        fileType: fileType || "pdf",
        fileSize: fileSize ? Number(fileSize) : 0,
      },
      include: { category: true }
    });

    return NextResponse.json({ success: true, data: newEbook });

  } catch (error) {
    console.error("Erro ao criar ebook:", error);
    return NextResponse.json({ success: false, error: "Erro ao salvar no banco" }, { status: 500 });
  }
}