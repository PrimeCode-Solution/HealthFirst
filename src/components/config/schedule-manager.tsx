"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, 
    CardContent, 
    CardHeader, 
    CardTitle } from "@/components/ui/card";
import { Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Save, User as UserIcon } from "lucide-react";
import { useSession } from "next-auth/react";

export function ScheduleManager() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const queryClient = useQueryClient();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(session?.user?.id || "");

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

  const { register, control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();
  const lunchBreakEnabled = watch("lunchBreakEnabled");

  // Atualiza o form quando os dados chegam
  useEffect(() => {
    if (scheduleData) {
      reset({
        startTime: scheduleData.startTime || "08:00",
        endTime: scheduleData.endTime || "18:00",
        appointmentDuration: scheduleData.appointmentDuration || 30,
        lunchBreakEnabled: scheduleData.lunchBreakEnabled || false,
        lunchStartTime: scheduleData.lunchStartTime || "12:00",
        lunchEndTime: scheduleData.lunchEndTime || "13:00",
        mondayEnabled: scheduleData.mondayEnabled ?? true,
        tuesdayEnabled: scheduleData.tuesdayEnabled ?? true,
        wednesdayEnabled: scheduleData.wednesdayEnabled ?? true,
        thursdayEnabled: scheduleData.thursdayEnabled ?? true,
        fridayEnabled: scheduleData.fridayEnabled ?? true,
        saturdayEnabled: scheduleData.saturdayEnabled ?? false,
        sundayEnabled: scheduleData.sundayEnabled ?? false,
      });
    }
  }, [scheduleData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post("/business-hours", { ...data, doctorId: selectedDoctorId });
    },
    onSuccess: () => {
      toast.success("Horários atualizados com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["business-hours", selectedDoctorId] });
    },
    onError: () => toast.error("Erro ao salvar horários."),
  });

  const onSubmit = (data: any) => {
    mutation.mutate({
        ...data,
        appointmentDuration: Number(data.appointmentDuration)
    });
  };

  if (!selectedDoctorId && isAdmin) {
     if(doctors && doctors.length > 0 && !selectedDoctorId) setSelectedDoctorId(doctors[0].id);
  }

  return (
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
                  <SelectItem key={doc.id} value={doc.id}>{doc.name} ({doc.email})</SelectItem>
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
            Configuração de Escala {isAdmin ? "(Modo Admin)" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Início do Expediente</label>
                    <Input type="time" {...register("startTime")} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Fim do Expediente</label>
                    <Input type="time" {...register("endTime")} />
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duração da Consulta (min)</label>
              <Input type="number" {...register("appointmentDuration")} />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-b my-4">
              <div>
                <label className="text-sm font-medium">Intervalo de Almoço</label>
              </div>
              <Controller
                name="lunchBreakEnabled"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            {lunchBreakEnabled && (
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Início Almoço</label>
                    <Input type="time" {...register("lunchStartTime")} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Fim Almoço</label>
                    <Input type="time" {...register("lunchEndTime")} />
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4">
              <label className="text-sm font-medium mb-2 block">Dias de Atendimento</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "mondayEnabled", label: "Segunda" },
                  { id: "tuesdayEnabled", label: "Terça" },
                  { id: "wednesdayEnabled", label: "Quarta" },
                  { id: "thursdayEnabled", label: "Quinta" },
                  { id: "fridayEnabled", label: "Sexta" },
                  { id: "saturdayEnabled", label: "Sábado" },
                  { id: "sundayEnabled", label: "Domingo" },
                ].map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Controller
                      name={day.id}
                      control={control}
                      render={({ field }) => (
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <label className="text-sm">{day.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
                onClick={handleSubmit(onSubmit)} 
                disabled={isSubmitting || isLoading} 
                className="w-full mt-6"
            >
                <Save className="mr-2 h-4 w-4" /> Salvar Escala
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}