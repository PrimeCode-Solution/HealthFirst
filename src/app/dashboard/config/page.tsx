"use client";

import React from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Save } from "lucide-react";
import { useBusinessHoursForm } from "@/presentation/business-hours/create/CreateBusinessHoursForm";
import { useCreateBussinesHours } from "@/presentation/business-hours/mutations/useBusinessHoursMutation";
import { CreateBusinessHoursDTO } from "@/modules/business-hours/domain/businessHours.interface";

export default function Config() {
  const {
    register,
    control,
    handleSubmit,
    errors,
    watch,
    setValue,
    isSubmitting,
  } = useBusinessHoursForm();

  const { mutate: createBusinessHours } = useCreateBussinesHours();

  const lunchBreakEnabled = watch("lunchBreakEnabled");

  const onSubmit = (data: CreateBusinessHoursDTO) =>{
    createBusinessHours({data});
    console.log(data)
  }
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Configurações - Horários</h1>
        <p className="text-gray-600">Defina os horários de funcionamento</p>
      </div>

      <div className="space-y-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horários Básicos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Horário de Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Horário de Início</label>
              <Input 
                type="time" 
                {...register("startTime")} 
                defaultValue="08:00"
              />
              {errors.startTime && (
                <p className="text-sm text-red-500">{errors.startTime.message}</p>
              )}
            </div>

            {/* Horário de Término */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Horário de Término</label>
              <Input 
                type="time" 
                {...register("endTime")} 
                defaultValue="18:00"
              />
              {errors.endTime && (
                <p className="text-sm text-red-500">{errors.endTime.message}</p>
              )}
            </div>

            {/* Duração da Consulta */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Duração da Consulta (min)</label>
              <Input
                required
                type="number"
                min="5"
                max="120"
                {...register("appointmentDuration", { valueAsNumber: true })}
                defaultValue={30}
              />
              {errors.appointmentDuration && (
                <p className="text-sm text-red-500">
                  {errors.appointmentDuration.message}
                </p>
              )}
            </div>

            {/* Intervalo para Almoço */}
            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm font-medium">Intervalo para Almoço</label>
                <p className="text-sm text-gray-500">Bloquear horários para almoço</p>
              </div>
              <Controller
                name="lunchBreakEnabled"
                control={control}
                defaultValue={true}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Horários de Almoço (condicional) */}
            {lunchBreakEnabled && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Início do Almoço</label>
                  <Input 
                    type="time" 
                    {...register("lunchStartTime")} 
                    defaultValue="12:00"
                  />
                  {errors.lunchStartTime && (
                    <p className="text-sm text-red-500">
                      {errors.lunchStartTime.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Fim do Almoço</label>
                  <Input 
                    type="time" 
                    {...register("lunchEndTime")} 
                    defaultValue="13:00"
                  />
                  {errors.lunchEndTime && (
                    <p className="text-sm text-red-500">
                      {errors.lunchEndTime.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Dias Disponíveis */}
            <div className="space-y-3 pt-4">
              <label className="text-sm font-medium">Dias Disponíveis</label>
              <div className="space-y-2">
                {[
                  { name: "mondayEnabled", label: "Segunda-feira", defaultValue: true },
                  { name: "tuesdayEnabled", label: "Terça-feira", defaultValue: true },
                  { name: "wednesdayEnabled", label: "Quarta-feira", defaultValue: true },
                  { name: "thursdayEnabled", label: "Quinta-feira", defaultValue: true },
                  { name: "fridayEnabled", label: "Sexta-feira", defaultValue: true },
                  { name: "saturdayEnabled", label: "Sábado", defaultValue: false },
                  { name: "sundayEnabled", label: "Domingo", defaultValue: false },
                ].map((day) => (
                  <div key={day.name} className="flex items-center space-x-3">
                    <Controller
                      name={day.name as any}
                      control={control}
                      defaultValue={day.defaultValue}
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <label className="text-sm font-normal">{day.label}</label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleSubmit(onSubmit)}
          className="flex items-center gap-2"
          disabled={isSubmitting}
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}