"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  parse,
  isAfter,
  isBefore,
  addMinutes,
  format,
  isWithinInterval,
  startOfDay,
  addDays,
  isWeekend,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Save, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";

const daysOfWeek = [
  { id: "monday", label: "Segunda-feira", value: "monday" },
  { id: "tuesday", label: "Terça-feira", value: "tuesday" },
  { id: "wednesday", label: "Quarta-feira", value: "wednesday" },
  { id: "thursday", label: "Quinta-feira", value: "thursday" },
  { id: "friday", label: "Sexta-feira", value: "friday" },
  { id: "saturday", label: "Sábado", value: "saturday" },
  { id: "sunday", label: "Domingo", value: "sunday" },
];

// Função auxiliar para converter string de hora em Date
const parseTimeString = (timeString: string): Date => {
  return parse(timeString, "HH:mm", new Date());
};

// Schema de validação com Zod para configurações
const configuracoesSchema = z
  .object({
    // Horários de funcionamento
    startTime: z.string().min(1, "Horário de início é obrigatório"),
    endTime: z.string().min(1, "Horário de término é obrigatório"),
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

    // Dias disponíveis
    availableDays: z.array(z.string()).min(1, "Selecione pelo menos um dia"),

    // Configurações gerais
    allowWeekends: z.boolean(),
    allowHolidays: z.boolean(),
    enableLunchBreak: z.boolean(),
    advanceBookingDays: z
      .number()
      .min(1, "Mínimo 1 dia de antecedência")
      .max(365, "Máximo 365 dias"),
    maxAppointmentsPerDay: z
      .number()
      .min(1, "Mínimo 1 consulta por dia")
      .max(50, "Máximo 50 consultas por dia"),
  })
  .refine(
    (data) => {
      // Validar se horário de término é após o início usando date-fns
      const start = parseTimeString(data.startTime);
      const end = parseTimeString(data.endTime);
      return isAfter(end, start);
    },
    {
      message: "Horário de término deve ser após o horário de início",
      path: ["endTime"],
    },
  )
  .refine(
    (data) => {
      // Validar horários de almoço apenas se habilitado
      if (!data.enableLunchBreak) return true;

      const lunchStart = parseTimeString(data.lunchStart);
      const lunchEnd = parseTimeString(data.lunchEnd);
      return isAfter(lunchEnd, lunchStart);
    },
    {
      message: "Fim do almoço deve ser após o início",
      path: ["lunchEnd"],
    },
  )
  .refine(
    (data) => {
      // Validar se almoço está dentro do horário de funcionamento
      if (!data.enableLunchBreak) return true;

      const start = parseTimeString(data.startTime);
      const end = parseTimeString(data.endTime);
      const lunchStart = parseTimeString(data.lunchStart);
      const lunchEnd = parseTimeString(data.lunchEnd);

      // Verificar se o almoço começa depois do início e termina antes do fim
      return (
        (isAfter(lunchStart, start) ||
          format(lunchStart, "HH:mm") === format(start, "HH:mm")) &&
        (isBefore(lunchEnd, end) ||
          format(lunchEnd, "HH:mm") === format(end, "HH:mm"))
      );
    },
    {
      message: "Horário de almoço deve estar dentro do funcionamento",
      path: ["lunchStart"],
    },
  );

type ConfiguracoesFormData = z.infer<typeof configuracoesSchema>;

export default function Configuracoes() {
  // Configuração do formulário com react-hook-form e Zod
  const form = useForm<ConfiguracoesFormData>({
    resolver: zodResolver(configuracoesSchema),
    defaultValues: {
      startTime: "08:00",
      endTime: "18:00",
      lunchStart: "12:00",
      lunchEnd: "13:00",
      consultationDuration: 30,
      intervalBetween: 15,
      availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      allowWeekends: false,
      allowHolidays: false,
      enableLunchBreak: true,
      advanceBookingDays: 30,
      maxAppointmentsPerDay: 20,
    },
  });

  const { watch, setValue } = form;
  const enableLunchBreak = watch("enableLunchBreak");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const lunchStart = watch("lunchStart");
  const lunchEnd = watch("lunchEnd");
  const consultationDuration = watch("consultationDuration");
  const intervalBetween = watch("intervalBetween");

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

  const handleSubmit = (data: ConfiguracoesFormData) => {
    // Aqui você salvaria as configurações no backend
    console.log("Configurações:", data);

    // Exemplo de uso das funções utilitárias com date-fns
    const availableDates = getAvailableBookingDates(data);
    const totalSlotsPerDay = generateTimeSlots().length;

    console.log(
      "📅 Próximas datas disponíveis:",
      availableDates
        .map((date) => format(date, "dd/MM/yyyy - EEEE", { locale: ptBR }))
        .slice(0, 7),
    ); // Mostra apenas os próximos 7 dias

    console.log("⏰ Total de horários por dia:", totalSlotsPerDay);
    console.log(
      "📊 Capacidade máxima diária:",
      Math.min(totalSlotsPerDay, data.maxAppointmentsPerDay),
    );

    // Exemplo de verificação de disponibilidade
    const tomorrow = addDays(new Date(), 1);
    const firstSlot = generateTimeSlots()[0];
    if (firstSlot) {
      const isAvailable = isTimeSlotAvailable(tomorrow, firstSlot, data);
      console.log(
        `🔍 Amanhã às ${firstSlot} está ${isAvailable ? "disponível" : "indisponível"}`,
      );
    }

    toast.success("Configurações salvas com sucesso!");
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];

    // Parse dos horários usando date-fns
    const start = parseTimeString(startTime);
    const end = parseTimeString(endTime);
    const lunchStartTime = parseTimeString(lunchStart);
    const lunchEndTime = parseTimeString(lunchEnd);

    let current = start;

    while (isBefore(current, end)) {
      // Calcular o fim do slot atual
      const slotEnd = addMinutes(current, consultationDuration);

      // Verificar se o slot está no horário de almoço (se habilitado)
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
          // Pular para o fim do almoço
          current = lunchEndTime;
          continue;
        }
      }

      // Verificar se o slot completo cabe no horário de funcionamento
      if (
        isBefore(slotEnd, end) ||
        format(slotEnd, "HH:mm") === format(end, "HH:mm")
      ) {
        slots.push(format(current, "HH:mm", { locale: ptBR }));
      }

      // Avançar para o próximo slot (duração + intervalo)
      current = addMinutes(current, consultationDuration + intervalBetween);
    }

    return slots;
  };

  // Função para calcular os próximos dias disponíveis para agendamento
  const getAvailableBookingDates = (formData: ConfiguracoesFormData) => {
    const availableDates: Date[] = [];
    const today = startOfDay(new Date());

    for (let i = 1; i <= formData.advanceBookingDays; i++) {
      const date = addDays(today, i);

      // Verificar se é fim de semana (se não permitido)
      if (!formData.allowWeekends && isWeekend(date)) {
        continue;
      }

      // Verificar se o dia da semana está disponível
      const dayOfWeek = format(date, "EEEE", { locale: ptBR }).toLowerCase();
      const dayMapping: Record<string, string> = {
        "segunda-feira": "monday",
        "terça-feira": "tuesday",
        "quarta-feira": "wednesday",
        "quinta-feira": "thursday",
        "sexta-feira": "friday",
        sábado: "saturday",
        domingo: "sunday",
      };

      if (formData.availableDays.includes(dayMapping[dayOfWeek])) {
        availableDates.push(date);
      }
    }

    return availableDates;
  };

  // Função para verificar se um horário específico está disponível
  const isTimeSlotAvailable = (
    date: Date,
    timeSlot: string,
    formData: ConfiguracoesFormData,
  ): boolean => {
    // Verificar se a data está dentro do período de agendamento antecipado
    const today = startOfDay(new Date());
    const maxDate = addDays(today, formData.advanceBookingDays);

    if (isBefore(date, today) || isAfter(date, maxDate)) {
      return false;
    }

    // Verificar se é fim de semana (se não permitido)
    if (!formData.allowWeekends && isWeekend(date)) {
      return false;
    }

    // Verificar se o horário está nos slots disponíveis
    const availableSlots = generateTimeSlots();
    return availableSlots.includes(timeSlot);
  };

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1">
        <div className="">
          <div className="sr-only mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Configurações
            </h1>
            <p className="text-gray-600">
              Gerencie os horários e dias disponíveis para agendamento
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Configurações de Horário */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Horários de Funcionamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    <Separator />

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

                    {enableLunchBreak && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="lunchStart"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Início do Almoço</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lunchEnd"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fim do Almoço</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
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
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="intervalBetween"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Intervalo entre Consultas (min)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="60"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Configurações de Dias */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Dias Disponíveis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="availableDays"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">
                            Dias da Semana
                          </FormLabel>
                          <FormDescription className="mb-4">
                            Selecione os dias disponíveis para agendamento
                          </FormDescription>
                          <div className="space-y-3">
                            {daysOfWeek.map((day) => (
                              <FormField
                                key={day.id}
                                control={form.control}
                                name="availableDays"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(
                                          day.value,
                                        )}
                                        onCheckedChange={(checked) => {
                                          handleDayToggle(
                                            day.value,
                                            checked as boolean,
                                          );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {day.label}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="allowWeekends"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Permitir Fins de Semana</FormLabel>
                              <FormDescription>
                                Habilitar agendamentos aos sábados e domingos
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
                        name="allowHolidays"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Permitir Feriados</FormLabel>
                              <FormDescription>
                                Habilitar agendamentos em feriados
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
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="advanceBookingDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agendamento Antecipado (dias)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="365"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Quantos dias de antecedência permitir agendamentos
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="maxAppointmentsPerDay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Máximo de Consultas por Dia</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="50"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Preview dos Horários */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Preview dos Horários Disponíveis</CardTitle>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">
                        Baseado nas configurações atuais, estes serão os
                        horários disponíveis:
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                        <span>
                          📊 Total: {generateTimeSlots().length} horários
                        </span>
                        <span>⏱️ Duração: {consultationDuration}min</span>
                        <span>🔄 Intervalo: {intervalBetween}min</span>
                        {enableLunchBreak && (
                          <span>
                            🍽️ Almoço: {lunchStart} - {lunchEnd}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                      {generateTimeSlots().map((slot, index) => (
                        <div
                          key={index}
                          className="rounded-md bg-green-100 px-3 py-2 text-center text-sm text-green-800 transition-colors hover:bg-green-200"
                        >
                          {slot}
                        </div>
                      ))}
                    </div>
                    {generateTimeSlots().length === 0 && (
                      <div className="py-8 text-center">
                        <p className="mb-2 text-gray-500">
                          ⚠️ Nenhum horário disponível com as configurações
                          atuais
                        </p>
                        <p className="text-xs text-gray-400">
                          Verifique se o horário de funcionamento está correto e
                          se não há conflitos com o almoço
                        </p>
                      </div>
                    )}

                    {generateTimeSlots().length > 0 && (
                      <div className="mt-4 rounded-lg bg-blue-50 p-3">
                        <h4 className="mb-2 font-medium text-blue-900">
                          📋 Resumo da Configuração
                        </h4>
                        <div className="grid grid-cols-1 gap-2 text-sm text-blue-800 md:grid-cols-3">
                          <div>
                            <strong>Funcionamento:</strong>
                            <br />
                            {startTime} às {endTime}
                          </div>
                          <div>
                            <strong>Capacidade diária:</strong>
                            <br />
                            Até{" "}
                            {Math.min(
                              generateTimeSlots().length,
                              watch("maxAppointmentsPerDay"),
                            )}{" "}
                            consultas
                          </div>
                          <div>
                            <strong>Agendamento:</strong>
                            <br />
                            Até {watch("advanceBookingDays")} dias antecipados
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Botão Salvar */}
              <div className="sticky bottom-5 mt-8 flex justify-end">
                <Button type="submit" size="lg" className="text-black">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
