import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { ApiResponse } from "@/types/api";

// GET /api/test-ebooks - Endpoint para testar a API (desenvolvimento)
export async function GET(request: NextRequest) {
  try {
    // Criar categoria de teste se não existir
    const testCategory = await prisma.ebookCategory.upsert({
      where: { name: "Saúde Geral" },
      update: {},
      create: {
        name: "Saúde Geral",
        description: "Categoria para ebooks de saúde geral",
        status: "ACTIVE"
      }
    });

    // Criar ebook de teste se não existir
    const testEbook = await prisma.ebook.upsert({
      where: { title: "Guia de Primeiros Socorros" },
      update: {},
      create: {
        title: "Guia de Primeiros Socorros",
        description: "Manual completo de primeiros socorros para emergências",
        author: "Dr. João Silva",
        categoryId: testCategory.id,
        isPremium: false,
        fileUrl: "/uploads/ebooks/primeiros-socorros.pdf",
        fileType: "pdf",
        fileSize: 1024000,
        isActive: true
      }
    });

    // Criar usuário admin de teste se não existir
    const testAdmin = await prisma.user.upsert({
      where: { email: "admin@healthfirst.com" },
      update: {},
      create: {
        clerkId: "test-admin-clerk-id",
        email: "admin@healthfirst.com",
        name: "Admin HealthFirst",
        role: "ADMIN"
      }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        message: "Dados de teste criados com sucesso",
        category: testCategory,
        ebook: testEbook,
        admin: testAdmin
      },
      error: null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao criar dados de teste:", error);
    
    const response: ApiResponse = {
      success: false,
      data: null,
      error: "Erro ao criar dados de teste"
    };
    return NextResponse.json(response, { status: 500 });
  }
}