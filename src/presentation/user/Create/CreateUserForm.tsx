"use client";

import React from "react";
import { useCreateUserForm } from "./useCreateUserForm";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@/modules/user/domain/user.interface";
import { Save } from "lucide-react";

// Função auxiliar de máscara
const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

export function CreateUserForm() {
  const { form, handleSubmit, isPending } = useCreateUserForm();

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          control={form.control as any}
          name="clerkId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clerk ID</FormLabel>
              <FormControl>
                <Input placeholder="ID do Clerk (ex: user_...)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control as any} 
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
          control={form.control as any} 
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
          control={form.control as any}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: (11) 99999-9999"
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

        <FormField
          control={form.control as any} 
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Usuário</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={UserRole.USER}>Paciente</SelectItem>
                  <SelectItem value={UserRole.DOCTOR}>Médico</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin Master</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar Usuário"}
        </Button>
      </form>
    </Form>
  );
}