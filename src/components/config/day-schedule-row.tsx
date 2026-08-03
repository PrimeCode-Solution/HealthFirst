"use client";

import React from "react";
import { Controller, type Control, type UseFormRegister } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CopyPlus, UtensilsCrossed } from "lucide-react";
import {
  generateDaySlots,
  validateDaySchedule,
  type ResolvedDaySchedule,
} from "@/modules/business-hours/domain/weeklySchedule";
import type { BusinessHoursValues } from "@/presentation/business-hours/schemas/businessHoursSchema";

type DayValues = NonNullable<BusinessHoursValues["days"]>[number];

interface DayScheduleRowProps {
  index: number;
  label: string;
  shortLabel: string;
  control: Control<BusinessHoursValues>;
  register: UseFormRegister<BusinessHoursValues>;
  /** Valores atuais do dia (via watch), para preview e validação inline */
  value?: DayValues;
  /** Duração global, usada quando o dia não define uma própria */
  fallbackDuration: number;
  onCopyToOthers: (index: number) => void;
}

export function DayScheduleRow({
  index,
  label,
  shortLabel,
  control,
  register,
  value,
  fallbackDuration,
  onCopyToOthers,
}: DayScheduleRowProps) {
  const duration = value?.appointmentDuration ?? fallbackDuration;

  const dayInput = {
    dayOfWeek: value?.dayOfWeek ?? 0,
    enabled: Boolean(value?.enabled),
    startTime: value?.startTime ?? "",
    endTime: value?.endTime ?? "",
    lunchBreakEnabled: Boolean(value?.lunchBreakEnabled),
    lunchStartTime: value?.lunchStartTime ?? null,
    lunchEndTime: value?.lunchEndTime ?? null,
    appointmentDuration: duration,
  };

  const error = validateDaySchedule(dayInput);

  // Só vale a pena calcular o preview quando o dia está coerente.
  const slots = error ? [] : generateDaySlots(dayInput as ResolvedDaySchedule);
  const isEnabled = Boolean(value?.enabled);

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        isEnabled ? "bg-card" : "bg-muted/40 border-dashed",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Controller
            name={`days.${index}.enabled`}
            control={control}
            render={({ field }) => (
              <Switch
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
                aria-label={`Atender ${label}`}
              />
            )}
          />
          <div>
            <p
              className={cn(
                "text-sm font-medium leading-none",
                !isEnabled && "text-muted-foreground",
              )}
            >
              {label}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isEnabled
                ? `${slots.length} horário${slots.length === 1 ? "" : "s"} de ${duration} min`
                : "Sem atendimento"}
            </p>
          </div>
        </div>

        {isEnabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onCopyToOthers(index)}
                className="text-xs"
              >
                <CopyPlus className="mr-1.5 h-3.5 w-3.5" />
                Replicar
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Copiar o horário de {shortLabel} para os demais dias ativos
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {isEnabled && (
        <div className="mt-4 space-y-4 border-t pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Início
              </label>
              <Input type="time" {...register(`days.${index}.startTime`)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Término
              </label>
              <Input type="time" {...register(`days.${index}.endTime`)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Duração (min)
              </label>
              <Controller
                name={`days.${index}.appointmentDuration`}
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    min={5}
                    step={5}
                    placeholder={`${fallbackDuration} (padrão)`}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />
                )}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Intervalo de almoço</span>
            </div>
            <Controller
              name={`days.${index}.lunchBreakEnabled`}
              control={control}
              render={({ field }) => (
                <Switch
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                  aria-label={`Intervalo de almoço em ${label}`}
                />
              )}
            />
          </div>

          {value?.lunchBreakEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Início do almoço
                </label>
                <Input
                  type="time"
                  {...register(`days.${index}.lunchStartTime`)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Fim do almoço
                </label>
                <Input type="time" {...register(`days.${index}.lunchEndTime`)} />
              </div>
            </div>
          )}

          {error ? (
            <p className="text-xs font-medium text-destructive">{error}</p>
          ) : (
            slots.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {slots.slice(0, 8).map((slot) => (
                  <Badge key={slot} variant="secondary" className="text-[11px] font-normal">
                    {slot}
                  </Badge>
                ))}
                {slots.length > 8 && (
                  <Badge variant="outline" className="text-[11px] font-normal">
                    +{slots.length - 8}
                  </Badge>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
