import  api  from '@/lib/api';

export interface Ebook {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  downloadUrl: string;
  categoryName: string;
}

async function getByCategory(categoryName: string): Promise<Ebook[]> {
  const response = await api.get('/ebooks', {
    params: { category: categoryName },
  });

  
  return response.data as Ebook[];
}

export const ebookService = {
  getByCategory,
};
