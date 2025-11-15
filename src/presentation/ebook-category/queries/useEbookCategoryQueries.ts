import { useQuery } from "@tanstack/react-query";
import { ebookCategoryService } from "../services/ebookCategoryService";

export const EBOOK_CATEGORY_QUERY_KEYS = {
  all: ["ebook-categories"] as const,
  list: () => [...EBOOK_CATEGORY_QUERY_KEYS.all, "list"] as const,
};

export const useGetEbookCategories = () => {
  return useQuery({
    queryKey: EBOOK_CATEGORY_QUERY_KEYS.list(),
    queryFn: ebookCategoryService.getCategories,
  });
};