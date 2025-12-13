import { useQuery } from '@tanstack/react-query';
import { ebookService, type Ebook } from '../services/ebookService';

export const EBOOK_QUERY_KEYS = {
  all: ['ebooks'] as const,
  byCategory: (categoryName: string) =>
    [...EBOOK_QUERY_KEYS.all, 'category', categoryName] as const,
};

export function useEbooksByCategory(categoryName: string) {
  return useQuery<Ebook[]>({
    queryKey: EBOOK_QUERY_KEYS.byCategory(categoryName),
    queryFn: () => ebookService.getByCategory(categoryName),
    enabled: !!categoryName,
  });
}
