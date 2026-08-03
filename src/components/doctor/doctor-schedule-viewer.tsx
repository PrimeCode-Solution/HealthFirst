import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import type { BusinessHours, BusinessHoursDay } from "@/generated/prisma";
import {
  WEEKDAYS,
  resolveWeekSchedule,
} from "@/modules/business-hours/domain/weeklySchedule";

interface DoctorScheduleViewerProps {
  businessHours: (BusinessHours & { days?: BusinessHoursDay[] }) | null;
}

export function DoctorScheduleViewer({ businessHours }: DoctorScheduleViewerProps) {
  if (!businessHours) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horários de Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Horários não configurados.</p>
        </CardContent>
      </Card>
    );
  }

  // Cada dia pode ter horário próprio; dias sem registro caem no horário global.
  const week = resolveWeekSchedule(businessHours).filter((day) => day.enabled);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Disponibilidade Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {week.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Nenhum dia de atendimento configurado.
          </p>
        )}

        {week.map((day) => (
          <div
            key={day.dayOfWeek}
            className="flex flex-wrap justify-between items-center gap-2 text-sm border-b pb-2 last:border-0 last:pb-0"
          >
            <span className="font-medium text-slate-700">
              {WEEKDAYS[day.dayOfWeek].label}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {day.startTime} - {day.endTime}
              </Badge>
              {day.lunchBreakEnabled && day.lunchStartTime && day.lunchEndTime && (
                <span className="text-xs text-muted-foreground">
                  (Pausa: {day.lunchStartTime} - {day.lunchEndTime})
                </span>
              )}
            </div>
          </div>
        ))}

        <div className="pt-4 mt-2 border-t text-xs text-muted-foreground">
          Duração média da consulta: {businessHours.appointmentDuration} min
        </div>
      </CardContent>
    </Card>
  );
}
