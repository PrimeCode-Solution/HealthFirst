"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ptBR } from "react-day-picker/locale";

export default function AgendamentosPage() {
  const { data: session } = useSession();
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Aqui será implementada a lógica de buscar as consultas do dia selecionado
  // e permitir a remarcação.
  
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Agendamentos</h1>
        <p className="text-muted-foreground">
          Marque ou remarque consultas. 
          {session?.user?.role === "DOCTOR" && " Você só pode gerenciar suas próprias consultas."}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Selecione a Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horários - {date?.toLocaleDateString('pt-BR')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-10">
              <p>Selecione um agendamento para ver detalhes ou remarcar.</p>
              {/* Lista de agendamentos virá aqui. 
                  Ao clicar em um agendamento, abrirá um modal para remarcar (PUT).
                  A API (backend) vai garantir que o médico só edite se doctorId == user.id 
              */}
              <Button className="mt-4">Novo Agendamento Manual</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}