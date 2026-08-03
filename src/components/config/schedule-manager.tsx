"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Clock, Loader2, Save, User as UserIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { DayScheduleRow } from "@/components/config/day-schedule-row";
import { useUpdateBusinessHoursForm } from "@/presentation/business-hours/update/UpdateBusinessHoursForm";
import type { BusinessHoursValues } from "@/presentation/business-hours/schemas/businessHoursSchema";
import {
  DEFAULT_APPOINTMENT_DURATION,
  WEEKDAYS,
  WEEKDAYS_DISPLAY_ORDER,
  normalizeTime,
} from "@/modules/business-hours/domain/weeklySchedule";

type DayValues = NonNullable<BusinessHoursValues["days"]>[number];

/**
 * Monta os 7 dias na ordem de exibição a partir da resposta da API.
 * Médicos que ainda usam a configuração antiga (um horário único para a semana)
 * têm os campos globais replicados para cada dia.
 */
function buildDaysFromResponse(scheduleData: any): DayValues[] {
  const existing: any[] = Array.isArray(scheduleData?.days) ? scheduleData.days : [];

  return WEEKDAYS_DISPLAY_ORDER.map((dayOfWeek) => {
    const specific = existing.find((d) => d.dayOfWeek === dayOfWeek);
    const legacyKey = WEEKDAYS[dayOfWeek].legacyKey;

    if (specific) {
      return {
        dayOfWeek,
        enabled: Boolean(specific.enabled),
        startTime: normalizeTime(specific.startTime) ?? "08:00",
        endTime: normalizeTime(specific.endTime) ?? "18:00",
        lunchBreakEnabled: Boolean(specific.lunchBreakEnabled),
        lunchStartTime: normalizeTime(specific.lunchStartTime) ?? "12:00",
        lunchEndTime: normalizeTime(specific.lunchEndTime) ?? "13:00",
        appointmentDuration: specific.appointmentDuration ?? null,
      };
    }

    return {
      dayOfWeek,
      enabled: Boolean(
        scheduleData?.[legacyKey] ?? (dayOfWeek >= 1 && dayOfWeek <= 5),
      ),
      startTime: normalizeTime(scheduleData?.startTime) ?? "08:00",
      endTime: normalizeTime(scheduleData?.endTime) ?? "18:00",
      lunchBreakEnabled: Boolean(scheduleData?.lunchBreakEnabled),
      lunchStartTime: normalizeTime(scheduleData?.lunchStartTime) ?? "12:00",
      lunchEndTime: normalizeTime(scheduleData?.lunchEndTime) ?? "13:00",
      appointmentDuration: null,
    };
  });
}

export function ScheduleManager() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const queryClient = useQueryClient();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    session?.user?.id || "",
  );

  // Busca lista de médicos (apenas para Admin)
  const { data: doctors } = useQuery({
    queryKey: ["doctors-list"],
    queryFn: async () => {
      const res = await api.get("/users?role=DOCTOR");
      return res.data.data.users;
    },
    enabled: isAdmin,
  });

  // Busca configurações do médico selecionado
  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ["business-hours", selectedDoctorId],
    queryFn: async () => {
      if (!selectedDoctorId) return null;
      const res = await api.get(`/business-hours?doctorId=${selectedDoctorId}`);
      return res.data;
    },
    enabled: !!selectedDoctorId,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    errors,
  } = useUpdateBusinessHoursForm();

  const { fields } = useFieldArray({ control, name: "days" });

  const watchedDays = watch("days");
  const globalDuration = Number(watch("appointmentDuration")) || DEFAULT_APPOINTMENT_DURATION;

  // Atualiza o form quando os dados chegam
  useEffect(() => {
    if (!scheduleData) return;

    reset({
      // Campos globais: continuam sendo enviados para compatibilidade, mas a
      // API os recalcula a partir do primeiro dia ativo.
      startTime: normalizeTime(scheduleData.startTime) ?? "08:00",
      endTime: normalizeTime(scheduleData.endTime) ?? "18:00",
      lunchBreakEnabled: Boolean(scheduleData.lunchBreakEnabled),
      lunchStartTime: normalizeTime(scheduleData.lunchStartTime) ?? "12:00",
      lunchEndTime: normalizeTime(scheduleData.lunchEndTime) ?? "13:00",
      appointmentDuration:
        scheduleData.appointmentDuration ?? DEFAULT_APPOINTMENT_DURATION,
      days: buildDaysFromResponse(scheduleData),
    } as BusinessHoursValues);
  }, [scheduleData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: BusinessHoursValues) => {
      return await api.post("/business-hours", {
        ...data,
        doctorId: selectedDoctorId,
      });
    },
    onSuccess: () => {
      toast.success("Horários atualizados com sucesso!");
      queryClient.invalidateQueries({
        queryKey: ["business-hours", selectedDoctorId],
      });
      queryClient.invalidateQueries({ queryKey: ["businessHoursSlots"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error ?? "Erro ao salvar horários.");
    },
  });

  const onSubmit = (data: BusinessHoursValues) => {
    mutation.mutate({
      ...data,
      appointmentDuration: Number(data.appointmentDuration),
      days: data.days?.map((day) => ({
        ...day,
        appointmentDuration:
          day.appointmentDuration == null ? null : Number(day.appointmentDuration),
        // Não envia horário de almoço quando o intervalo está desligado
        lunchStartTime: day.lunchBreakEnabled ? day.lunchStartTime : null,
        lunchEndTime: day.lunchBreakEnabled ? day.lunchEndTime : null,
      })),
    });
  };

  // Copia o horário de um dia para todos os outros dias que estão ativos.
  const handleCopyToOthers = (sourceIndex: number) => {
    const days = getValues("days") ?? [];
    const source = days[sourceIndex];
    if (!source) return;

    days.forEach((day, index) => {
      if (index === sourceIndex || !day.enabled) return;
      setValue(`days.${index}.startTime`, source.startTime, { shouldDirty: true });
      setValue(`days.${index}.endTime`, source.endTime, { shouldDirty: true });
      setValue(`days.${index}.lunchBreakEnabled`, source.lunchBreakEnabled, {
        shouldDirty: true,
      });
      setValue(`days.${index}.lunchStartTime`, source.lunchStartTime, {
        shouldDirty: true,
      });
      setValue(`days.${index}.lunchEndTime`, source.lunchEndTime, {
        shouldDirty: true,
      });
      setValue(`days.${index}.appointmentDuration`, source.appointmentDuration, {
        shouldDirty: true,
      });
    });

    const label = WEEKDAYS[source.dayOfWeek]?.label ?? "";
    toast.success(`Horário de ${label} replicado para os demais dias ativos.`);
  };

  // Presets rápidos: liga/desliga blocos inteiros da semana.
  const applyPreset = (preset: "weekdays" | "everyday" | "none") => {
    const days = getValues("days") ?? [];
    days.forEach((day, index) => {
      const enabled =
        preset === "everyday"
          ? true
          : preset === "none"
            ? false
            : day.dayOfWeek >= 1 && day.dayOfWeek <= 5;
      setValue(`days.${index}.enabled`, enabled, { shouldDirty: true });
    });
  };

  const activeDaysCount = useMemo(
    () => (watchedDays ?? []).filter((day) => day?.enabled).length,
    [watchedDays],
  );

  useEffect(() => {
    if (isAdmin && !selectedDoctorId && doctors?.length > 0) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [isAdmin, selectedDoctorId, doctors]);

  const daysError = errors.days?.message ?? (errors.days as any)?.root?.message;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" /> Selecione o Médico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um médico" />
                </SelectTrigger>
                <SelectContent>
                  {doctors?.map((doc: any) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name} ({doc.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Escala Semanal {isAdmin ? "(Modo Admin)" : ""}
            </CardTitle>
            <CardDescription>
              Defina o horário de atendimento de cada dia da semana. Dias
              desativados não aparecem para agendamento.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border bg-muted/40 p-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Duração padrão da consulta (min)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Aplicada aos dias que não definem uma duração própria.
                    </p>
                    <Input
                      type="number"
                      min={5}
                      step={5}
                      className="w-32"
                      {...register("appointmentDuration", { valueAsNumber: true })}
                    />
                    {errors.appointmentDuration && (
                      <p className="text-xs text-destructive">
                        {errors.appointmentDuration.message as string}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset("weekdays")}
                    >
                      Seg a Sex
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset("everyday")}
                    >
                      Todos os dias
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset("none")}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => {
                    const dayOfWeek = watchedDays?.[index]?.dayOfWeek ?? 0;
                    const meta = WEEKDAYS[dayOfWeek];

                    return (
                      <DayScheduleRow
                        key={field.id}
                        index={index}
                        label={meta?.label ?? ""}
                        shortLabel={meta?.short ?? ""}
                        control={control}
                        register={register}
                        value={watchedDays?.[index] as DayValues}
                        fallbackDuration={globalDuration}
                        onCopyToOthers={handleCopyToOthers}
                      />
                    );
                  })}
                </div>

                {daysError && (
                  <p className="text-sm font-medium text-destructive">{daysError}</p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    {activeDaysCount} dia{activeDaysCount === 1 ? "" : "s"} de
                    atendimento por semana
                  </p>
                  <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={mutation.isPending || isLoading || !selectedDoctorId}
                  >
                    {mutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Escala
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
