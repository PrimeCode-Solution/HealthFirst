"use client";

import React from "react";
import {
  useUpdateUserForm,
  UseUpdateUserFormProps,
} from "./useUpdateUserForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "@/modules/user/domain/user.interface";
import { Save } from "lucide-react";

interface UpdateUserFormProps {
  user: User;
  onSuccess?: () => void;
}

export function UpdateUserForm({ user, onSuccess }: UpdateUserFormProps) {
  const { form, handleSubmit, isPending } = useUpdateUserForm({
    user,
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
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input placeholder="Ex: joao@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: (11) 99999-9999" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Atualizando..." : "Atualizar Usuário"}
        </Button>
      </form>
    </Form>
  );
}