"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEditAppointmentMutation } from "../mutations/useAppointmentMutations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

const EditAppointmentSchema = z.object({
  date: z.date(),
  startTime: z.string().min(1, "Obrigatório"),
  endTime: z.string().min(1, "Obrigatório"),
  patientName: z.string().min(1, "Obrigatório"),
  patientEmail: z.string().email().optional().or(z.literal("")),
  patientPhone: z.string().optional(),
  notes: z.string().optional(),
  amount: z.coerce.number().optional(),
  description: z.string().optional(),
});

type EditAppointmentType = z.infer<typeof EditAppointmentSchema>;

export function EditAppointmentForm({ appointment, onSuccess }: { appointment: any, onSuccess: () => void }) {
  const editMutation = useEditAppointmentMutation();

  const form = useForm<EditAppointmentType>({
    resolver: zodResolver(EditAppointmentSchema),
    defaultValues: {
      date: new Date(appointment.date),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      patientName: appointment.patientName,
      patientEmail: appointment.patientEmail || "",
      patientPhone: appointment.patientPhone || "",
      notes: appointment.notes || "",
      amount: Number(appointment.payment?.amount) || 0,
      description: appointment.payment?.description || "",
    },
  });

  const startTime = form.watch("startTime");

  useEffect(() => {
    if (startTime) {
      const [hours, minutes] = startTime.split(":").map(Number);
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes + 30);
      const endHours = String(date.getHours()).padStart(2, "0");
      const endMinutes = String(date.getMinutes()).padStart(2, "0");
      form.setValue("endTime", `${endHours}:${endMinutes}`);
    }
  }, [startTime, form]);

  const onSubmit = (data: EditAppointmentType) => {
    editMutation.mutate(
      { id: appointment.id, data },
      {
        onSuccess: () => {
          onSuccess();
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="patientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="patientEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Início</FormLabel>
                <FormControl><Input type="time" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fim (Auto)</FormLabel>
                <FormControl><Input type="time" {...field} readOnly className="bg-muted" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 h-4 w-4"/> Salvar Alterações</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}