"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, XCircle, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export function PatientDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["patient-dashboard"],
    queryFn: async () => {
      const res = await api.get("/dashboard/stats");
      return res.data;
    },
  });

    const nextAppointment = data?.nextAppointment;
    const confirmedAppointmentsCount = data?.confirmedAppointmentsCount;
    const cancelledAppointmentsCount = data?.cancelledAppointmentsCount;
    const recentAppointments = data?.recentAppointments || [];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">

  <div>
    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Meu Painel</h2>
    <p className="text-muted-foreground">Acompanhe seus agendamentos e histórico.</p>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

    <Card className="rounded-2xl border">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Próxima Consulta</CardTitle>
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="text-2xl sm:text-3xl font-bold">
        {nextAppointment
          ? `${nextAppointment.formattedDate} - ${nextAppointment.formattedTime}`
          : "Nenhuma"}
      </CardContent>
    </Card>

    <Card className="rounded-2xl border">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Consultas Confirmadas</CardTitle>
        <CheckCircle2 className="h-5 w-5 text-green-500/50" />
      </CardHeader>
      <CardContent className="text-2xl sm:text-3xl font-bold">{confirmedAppointmentsCount}</CardContent>
    </Card>

    <Card className="rounded-2xl border">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Cancelamentos</CardTitle>
        <XCircle className="h-5 w-5 text-red-500/50" />
      </CardHeader>
      <CardContent className="text-2xl sm:text-3xl font-bold">{cancelledAppointmentsCount}</CardContent>
    </Card>
  </div>

  <Card className="rounded-2xl border overflow-x-auto">
    <CardHeader className="flex items-center justify-between">
      <CardTitle>Últimos Agendamentos</CardTitle>
    </CardHeader>
    <CardContent className="min-w-[400px]">
      {recentAppointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum agendamento ainda.</p>
      ) : (
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentAppointments.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell>{item.formattedDate}</TableCell>
                <TableCell>{item.formattedTime}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.status === "COMPLETED"
                        ? "default"
                        : item.status === "CANCELLED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>

  <div className="pt-4 flex justify-center sm:justify-start">
    <Link href="/dashboard/agendamentos" className="w-full sm:w-auto">
      <Button className="w-full sm:w-auto">Agendar Nova Consulta</Button>
    </Link>
  </div>
</div>
  );
}
