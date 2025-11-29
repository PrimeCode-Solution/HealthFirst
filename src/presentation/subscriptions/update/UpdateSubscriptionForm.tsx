"use client";

import React from "react";
import { useFormUpSubscriptions } from "./useFormUpSubscriptions";
import { useGetSubscription } from "@/presentation/subscriptions/queries/useSubscriptionQueries";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import { SubscriptionStatus } from "@/modules/subscriptons/domain/subscription.interface";

interface Props {
  subscriptionId: string;
}

export function UpdateSubscriptionForm({ subscriptionId }: Props) {
  const { data: subscription, isLoading } = useGetSubscription(subscriptionId);
  // Garantindo que subscription seja undefined se for null para o hook
  const { form, onSubmit, isPending } = useFormUpSubscriptions(subscription ?? undefined);

  if (isLoading) return <div>Carregando dados da assinatura...</div>;
  if (!subscription) return <div>Assinatura não encontrada.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Assinatura</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control as any}
              name="planName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Plano</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(SubscriptionStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "Atualizando..." : "Salvar Alterações"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}