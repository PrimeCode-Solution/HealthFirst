import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { BusinessHours } from "@/generated/prisma";

interface DoctorScheduleViewerProps {
  businessHours: BusinessHours | null;
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

  const days = [
    { key: "mondayEnabled", label: "Segunda-feira" },
    { key: "tuesdayEnabled", label: "Terça-feira" },
    { key: "wednesdayEnabled", label: "Quarta-feira" },
    { key: "thursdayEnabled", label: "Quinta-feira" },
    { key: "fridayEnabled", label: "Sexta-feira" },
    { key: "saturdayEnabled", label: "Sábado" },
    { key: "sundayEnabled", label: "Domingo" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Disponibilidade Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {days.map((day) => {
          // @ts-ignore - Acesso dinâmico seguro pois as chaves existem no tipo
          const isEnabled = businessHours[day.key as keyof BusinessHours] as boolean;

          if (!isEnabled) return null;

          return (
            <div key={day.key} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
              <span className="font-medium text-slate-700">{day.label}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {businessHours.startTime} - {businessHours.endTime}
                </Badge>
                {businessHours.lunchBreakEnabled && (
                  <span className="text-xs text-muted-foreground">
                    (Pausa: {businessHours.lunchStartTime} - {businessHours.lunchEndTime})
                  </span>
                )}
              </div>
            </div>
          );
        })}
        
        <div className="pt-4 mt-2 border-t text-xs text-muted-foreground">
           Duração média da consulta: {businessHours.appointmentDuration} min
        </div>
      </CardContent>
    </Card>
  );
}