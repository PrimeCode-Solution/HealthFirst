"use client";

import React from "react";
import { useFormInSubscriptions, CreateSubscriptionFormData } from "./useFormInSubscriptions";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";

export function CreateSubscriptionForm() {
  const { form, onSubmit, isPending } = useFormInSubscriptions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Assinatura</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control as any}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID do Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="ID do usuário..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="preapprovalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID do Mercado Pago (Preapproval)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 2c9380..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="planName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Plano</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Plano Premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "Criando..." : "Criar Assinatura"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}