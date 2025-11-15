"use client";

import React from "react";
import {
  useUpdateEbookCategoryForm,
  UseUpdateEbookCategoryFormProps,
} from "./useUpdateEbookCategoryForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { EbookCategory } from "@/types/ebook";

interface UpdateEbookCategoryFormProps {
  category: EbookCategory;
  onSuccess?: () => void;
}

export function UpdateEbookCategoryForm({
  category,
  onSuccess,
}: UpdateEbookCategoryFormProps) {
  const { form, handleSubmit, isPending } = useUpdateEbookCategoryForm({
    category,
    onSuccess,
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Categoria</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Nutrição" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva sobre o que é esta categoria..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Atualizando..." : "Atualizar Categoria"}
        </Button>
      </form>
    </Form>
  );
}