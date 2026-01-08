"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema do formulário
const formSchema = z.object({
  patientName: z.string().min(3, "Nome do paciente é obrigatório"),
  patientEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
  patientPhone: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida (HH:MM)"),
  type: z.enum(["GENERAL", "URGENT", "FOLLOWUP"]),
  doctorId: z.string().optional(), // Opcional no Zod pois Médico não preenche
  amount: z.string().min(1, "Valor é obrigatório"),
});

type FormValues = z.infer<typeof formSchema>;

export function useCreateAppointmentMutation() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  const { data: doctorsList } = useQuery({
    queryKey: ["admin-doctors-list"],
    queryFn: async () => {
      const res = await api.get("/users?role=DOCTOR");
      return res.data.data.users;
    },
    enabled: isAdmin,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      patientEmail: "",
      patientPhone: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "09:30",
      type: "GENERAL",
      amount: "150",
      doctorId: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      setErrorMsg(null); 
      
      // Validação extra para Admin
      if (isAdmin && !values.doctorId) {
        throw new Error("Selecione um médico responsável.");
      }

      const payload = {
        ...values,
        amount: Number(values.amount),
        doctorId: isAdmin ? values.doctorId : undefined, 
      };
      
      const { data } = await api.post("/appointments", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Agendamento criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      form.reset();
      setErrorMsg(null);
    },
    onError: (error: any) => {
      console.error("Erro no agendamento:", error);
      
      if (error.status === 409) {
        const conflictMsg = "Este horário acabou de ser reservado por outro paciente. Por favor, escolha outro.";
        setErrorMsg(conflictMsg);
        toast.error(conflictMsg);
      } else {
        const msg = error.response?.data?.error || error.message || "Erro ao criar agendamento.";
        setErrorMsg(msg);
        toast.error(msg);
      }
    },
  });

  function onSubmit(values: FormValues) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        
        {errorMsg && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro no Agendamento</AlertTitle>
            <AlertDescription>
              {errorMsg}
            </AlertDescription>
          </Alert>
        )}

        {/* Dados do Paciente */}
        <div className="grid gap-4 sm:grid-cols-2">
            <FormField
            control={form.control}
            name="patientName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nome do Paciente</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: João Silva" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            
            <FormField
            control={form.control}
            name="patientPhone"
            render={({ field }) => (
                <FormItem>
                <FormLabel>WhatsApp / Telefone</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: 82999999999" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="patientEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isAdmin && (
           <FormField
           control={form.control}
           name="doctorId"
           render={({ field }) => (
             <FormItem>
               <FormLabel className="text-emerald-700 font-semibold">Médico Responsável</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value}>
                 <FormControl>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione o médico" />
                   </SelectTrigger>
                 </FormControl>
                 <SelectContent>
                   {doctorsList?.map((doc: any) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                      </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <FormMessage />
             </FormItem>
           )}
         />
        )}

        {/* Data e Hora */}
        <div className="grid gap-4 grid-cols-3">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                <FormLabel>Fim</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tipo de Consulta</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="GENERAL">Consulta Geral</SelectItem>
                    <SelectItem value="URGENT">Urgência</SelectItem>
                    <SelectItem value="FOLLOWUP">Retorno</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                    <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            disabled={mutation.isPending}
        >
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Agendar Consulta
        </Button>
      </form>
    </Form>
  );
}