"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  parse,
  isAfter,
  format,
  addDays,
  addMinutes,
  isBefore,
  isWithinInterval,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Save } from "lucide-react";

// Função auxiliar para converter string de hora em Date
const parseTimeString = (timeString: string): Date => {
  try {
    return parse(timeString, "HH:mm", new Date());
  } catch (error) {
    console.error("Erro ao parsear horário:", timeString, error);
    return new Date();
  }
};

// Schema com validações mais complexas para testar
const configSchema = z
  .object({
    startTime: z.string().min(1, "Horário é obrigatório"),
    endTime: z.string().min(1, "Horário é obrigatório"),
    lunchStart: z.string().min(1, "Início do almoço é obrigatório"),
    lunchEnd: z.string().min(1, "Fim do almoço é obrigatório"),
    consultationDuration: z
      .number()
      .min(15, "Duração mínima é 15 minutos")
      .max(120, "Duração máxima é 120 minutos"),
    intervalBetween: z
      .number()
      .min(0, "Intervalo não pode ser negativo")
      .max(60, "Intervalo máximo é 60 minutos"),
    enableLunchBreak: z.boolean(),
    allowWeekends: z.boolean(),
    availableDays: z.array(z.string()).min(1, "Selecione pelo menos um dia"),
  })
  .refine(
    (data) => {
      // Validar se horário de término é após o início
      try {
        const start = parseTimeString(data.startTime);
        const end = parseTimeString(data.endTime);
        return isAfter(end, start);
      } catch {
        return false;
      }
    },
    {
      message: "Horário de término deve ser após o horário de início",
      path: ["endTime"],
    },
  );

type ConfigFormData = z.infer<typeof configSchema>;

export default function Config() {
  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      startTime: "08:00",
      endTime: "18:00",
      lunchStart: "12:00",
      lunchEnd: "13:00",
      consultationDuration: 30,
      intervalBetween: 15,
      enableLunchBreak: true,
      allowWeekends: false,
      availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    },
  });

  const { setValue, watch } = form;

  const enableLunchBreak = watch("enableLunchBreak");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const lunchStart = watch("lunchStart");
  const lunchEnd = watch("lunchEnd");
  const consultationDuration = watch("consultationDuration");
  const intervalBetween = watch("intervalBetween");

  const generateTimeSlots = () => {
    try {
      const slots: string[] = [];
      const start = parseTimeString(startTime);
      const end = parseTimeString(endTime);
      const lunchStartTime = parseTimeString(lunchStart);
      const lunchEndTime = parseTimeString(lunchEnd);

      let current = start;

      while (isBefore(current, end)) {
        const slotEnd = addMinutes(current, consultationDuration);

        // Verificar se está no horário de almoço
        if (enableLunchBreak) {
          const isInLunchTime =
            isWithinInterval(current, {
              start: lunchStartTime,
              end: lunchEndTime,
            }) ||
            isWithinInterval(slotEnd, {
              start: lunchStartTime,
              end: lunchEndTime,
            });

          if (isInLunchTime) {
            current = lunchEndTime;
            continue;
          }
        }

        // Verificar se cabe no horário de funcionamento
        if (
          isBefore(slotEnd, end) ||
          format(slotEnd, "HH:mm") === format(end, "HH:mm")
        ) {
          slots.push(format(current, "HH:mm"));
        }

        current = addMinutes(current, consultationDuration + intervalBetween);
      }

      return slots;
    } catch (error) {
      console.error("Erro ao gerar slots:", error);
      return [];
    }
  };

  const handleDayToggle = (dayValue: string, checked: boolean) => {
    const currentDays = form.getValues("availableDays");
    if (checked) {
      setValue("availableDays", [...currentDays, dayValue]);
    } else {
      setValue(
        "availableDays",
        currentDays.filter((day) => day !== dayValue),
      );
    }
  };

  const handleSubmit = (data: ConfigFormData) => {
    console.log("Configurações:", data);
    alert("Funcionou!");
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Configurações - Horários</h1>
        <p className="text-gray-600">Defina os horários de funcionamento</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horários Básicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Início</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableLunchBreak"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Intervalo para Almoço</FormLabel>
                      <FormDescription>
                        Bloquear horários para almoço
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowWeekends"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Permitir Fins de Semana</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Dias Disponíveis</FormLabel>
                <div className="space-y-2">
                  {["monday", "tuesday", "wednesday", "thursday", "friday"].map(
                    (day) => (
                      <FormField
                        key={day}
                        control={form.control}
                        name="availableDays"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day)}
                                onCheckedChange={(checked) => {
                                  handleDayToggle(day, checked as boolean);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {day === "monday" && "Segunda-feira"}
                              {day === "tuesday" && "Terça-feira"}
                              {day === "wednesday" && "Quarta-feira"}
                              {day === "thursday" && "Quinta-feira"}
                              {day === "friday" && "Sexta-feira"}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ),
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Término</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consultationDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração da Consulta (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="15"
                        max="120"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Salvar
          </Button>
        </form>
      </Form>
    </div>
  );
}
