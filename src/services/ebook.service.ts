import { prisma } from "@/app/providers/prisma";
import { checkPremiumAccess } from "@/lib/auth-middleware";
import { 
  Ebook, 
  EbookWithAccess, 
  EbookCategory, 
  UserEbookAccess,
  CreateEbookDTO,
  UpdateEbookDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  EbookFilters,
  PaginatedResponse
} from "@/types/api";

export class EbookService {
  // Categorias
  static async createCategory(data: CreateCategoryDTO): Promise<EbookCategory> {
    const category = await prisma.ebookCategory.create({
      data,
      include: {
        _count: {
          select: { ebooks: true }
        }
      }
    });

    return {
      ...category,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    };
  }

  static async getCategories(includeInactive = false): Promise<EbookCategory[]> {
    const categories = await prisma.ebookCategory.findMany({
      where: includeInactive ? {} : { status: "ACTIVE" },
      include: {
        _count: {
          select: {
            ebooks: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return categories.map(cat => ({
      ...cat,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString()
    }));
  }

  static async updateCategory(id: string, data: UpdateCategoryDTO): Promise<EbookCategory> {
    const category = await prisma.ebookCategory.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { ebooks: true }
        }
      }
    });

    return {
      ...category,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    };
  }

  static async deleteCategory(id: string): Promise<void> {
    await prisma.ebookCategory.delete({
      where: { id }
    });
  }

  // Ebooks
  static async createEbook(data: CreateEbookDTO & { 
    fileUrl: string; 
    fileSize: number; 
    coverImage?: string; 
  }): Promise<Ebook> {
    const ebook = await prisma.ebook.create({
      data,
      include: {
        category: true
      }
    });

    return {
      ...ebook,
      price: ebook.price ? Number(ebook.price) : null,
      createdAt: ebook.createdAt.toISOString(),
      updatedAt: ebook.updatedAt.toISOString(),
      category: {
        ...ebook.category,
        createdAt: ebook.category.createdAt.toISOString(),
        updatedAt: ebook.category.updatedAt.toISOString()
      }
    };
  }

  static async getEbooks(
    filters: EbookFilters & { page: number; limit: number },
    userId?: string
  ): Promise<PaginatedResponse<EbookWithAccess>> {
    const where: any = {};
    
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.isPremium !== undefined) where.isPremium = filters.isPremium;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { author: { contains: filters.search, mode: "insensitive" } }
      ];
    }

    const offset = (filters.page - 1) * filters.limit;

    const [ebooks, total] = await Promise.all([
      prisma.ebook.findMany({
        where,
        include: {
          category: true,
          userAccess: userId ? {
            where: { userId }
          } : false
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: filters.limit
      }),
      prisma.ebook.count({ where })
    ]);

    // Verificar acesso premium se usuário logado
    let hasPremiumAccess = false;
    if (userId) {
      hasPremiumAccess = await checkPremiumAccess(userId);
    }

    const items: EbookWithAccess[] = ebooks.map(ebook => ({
      ...ebook,
      price: ebook.price ? Number(ebook.price) : null,
      createdAt: ebook.createdAt.toISOString(),
      updatedAt: ebook.updatedAt.toISOString(),
      category: {
        ...ebook.category,
        createdAt: ebook.category.createdAt.toISOString(),
        updatedAt: ebook.category.updatedAt.toISOString()
      },
      hasAccess: !ebook.isPremium || hasPremiumAccess,
      userAccess: ebook.userAccess?.[0] ? {
        ...ebook.userAccess[0],
        lastDownload: ebook.userAccess[0].lastDownload?.toISOString() || null,
        firstAccess: ebook.userAccess[0].firstAccess.toISOString(),
        lastAccess: ebook.userAccess[0].lastAccess.toISOString(),
        createdAt: ebook.userAccess[0].createdAt.toISOString(),
        updatedAt: ebook.userAccess[0].updatedAt.toISOString()
      } : undefined
    }));

    return {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit)
    };
  }

  static async getEbookById(id: string, userId?: string): Promise<EbookWithAccess | null> {
    const ebook = await prisma.ebook.findUnique({
      where: { id },
      include: {
        category: true,
        userAccess: userId ? {
          where: { userId }
        } : false
      }
    });

    if (!ebook) return null;

    // Verificar acesso premium se usuário logado
    let hasPremiumAccess = false;
    if (userId) {
      hasPremiumAccess = await checkPremiumAccess(userId);
    }

    return {
      ...ebook,
      price: ebook.price ? Number(ebook.price) : null,
      createdAt: ebook.createdAt.toISOString(),
      updatedAt: ebook.updatedAt.toISOString(),
      category: {
        ...ebook.category,
        createdAt: ebook.category.createdAt.toISOString(),
        updatedAt: ebook.category.updatedAt.toISOString()
      },
      hasAccess: !ebook.isPremium || hasPremiumAccess,
      userAccess: ebook.userAccess?.[0] ? {
        ...ebook.userAccess[0],
        lastDownload: ebook.userAccess[0].lastDownload?.toISOString() || null,
        firstAccess: ebook.userAccess[0].firstAccess.toISOString(),
        lastAccess: ebook.userAccess[0].lastAccess.toISOString(),
        createdAt: ebook.userAccess[0].createdAt.toISOString(),
        updatedAt: ebook.userAccess[0].updatedAt.toISOString()
      } : undefined
    };
  }

  static async updateEbook(id: string, data: UpdateEbookDTO): Promise<Ebook> {
    const ebook = await prisma.ebook.update({
      where: { id },
      data,
      include: {
        category: true
      }
    });

    return {
      ...ebook,
      price: ebook.price ? Number(ebook.price) : null,
      createdAt: ebook.createdAt.toISOString(),
      updatedAt: ebook.updatedAt.toISOString(),
      category: {
        ...ebook.category,
        createdAt: ebook.category.createdAt.toISOString(),
        updatedAt: ebook.category.updatedAt.toISOString()
      }
    };
  }

  static async deleteEbook(id: string): Promise<void> {
    await prisma.ebook.delete({
      where: { id }
    });
  }

  // Acesso e tracking
  static async recordAccess(userId: string, ebookId: string): Promise<UserEbookAccess> {
    const access = await prisma.userEbookAccess.upsert({
      where: {
        userId_ebookId: {
          userId,
          ebookId
        }
      },
      update: {
        lastAccess: new Date()
      },
      create: {
        userId,
        ebookId
      }
    });

    return {
      ...access,
      lastDownload: access.lastDownload?.toISOString() || null,
      firstAccess: access.firstAccess.toISOString(),
      lastAccess: access.lastAccess.toISOString(),
      createdAt: access.createdAt.toISOString(),
      updatedAt: access.updatedAt.toISOString()
    };
  }

  static async getUserEbookAccess(userId: string, ebookId: string): Promise<UserEbookAccess | null> {
    const access = await prisma.userEbookAccess.findUnique({
      where: {
        userId_ebookId: {
          userId,
          ebookId
        }
      }
    });

    if (!access) return null;

    return {
      ...access,
      lastDownload: access.lastDownload?.toISOString() || null,
      firstAccess: access.firstAccess.toISOString(),
      lastAccess: access.lastAccess.toISOString(),
      createdAt: access.createdAt.toISOString(),
      updatedAt: access.updatedAt.toISOString()
    };
  }

  // Estatísticas
  static async getEbookStats() {
    const [
      totalEbooks,
      premiumEbooks,
      freeEbooks,
      totalDownloads,
      totalViews,
      categoriesCount
    ] = await Promise.all([
      prisma.ebook.count({ where: { isActive: true } }),
      prisma.ebook.count({ where: { isPremium: true, isActive: true } }),
      prisma.ebook.count({ where: { isPremium: false, isActive: true } }),
      prisma.ebook.aggregate({
        _sum: { downloadCount: true },
        where: { isActive: true }
      }),
      prisma.ebook.aggregate({
        _sum: { viewCount: true },
        where: { isActive: true }
      }),
      prisma.ebookCategory.count({ where: { status: "ACTIVE" } })
    ]);

    return {
      totalEbooks,
      premiumEbooks,
      freeEbooks,
      totalDownloads: totalDownloads._sum.downloadCount || 0,
      totalViews: totalViews._sum.viewCount || 0,
      categoriesCount
    };
  }
}