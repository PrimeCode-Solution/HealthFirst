"use client";

import React from "react";
import {
  useUpdateUserForm,
  UseUpdateUserFormProps,
} from "./useUpdateUserForm";
import { useUpdateUserMutation } from "../mutations/useUserMutations";
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

// Função auxiliar de máscara
const formatPhone = (value: string) => {
  if (!value) return "";
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

interface UpdateUserFormProps {
  user: User;
  onSuccess?: () => void;
}

export function UpdateUserForm({ user, onSuccess }: UpdateUserFormProps) {
  const updateMutation = useUpdateUserMutation();
  const { form, handleSubmit, isPending } = useUpdateUserForm({
    user,
    onSuccess,
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(
      { 
        userId: user.id, 
        data: data    
      },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
        }
      }
    );
  };

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
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: (82) 99999-9999"
                  {...field}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    field.onChange(formatted);
                  }}
                  maxLength={15}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </form>
    </Form>
  );
}