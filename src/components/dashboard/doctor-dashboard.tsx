"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle,  } from "@/components/ui/card";
import { CalendarDays, UserCheck, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormattedAppointments } from "@/app/api/dashboard/stats/route";

export function DoctorDashboard() {

    const [open, setOpen] = useState(false);
    const { data, isLoading } = useQuery({
    queryKey: ["doctor-dashboard"],
    queryFn: async () => {
      const response = await api.get("/dashboard/stats");
      return response.data;
    },
  });

  const summary = data?.metrics || {
    cancelledAppointments: 0,
    todaysAppointments: 0,
    totalPatientsAttended: 0,
  };

  const upcoming = data?.upcomingAppointments || [];
  const recent = data?.recentAppointments || [];

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
    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard do Doutor</h2>
    <p className="text-muted-foreground">Acompanhe seus atendimentos e agendamentos</p>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <Card className="rounded-2xl border">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Próximas Consultas Hoje</CardTitle>
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="text-2xl sm:text-3xl font-bold">
        {summary.todaysAppointments}
      </CardContent>
    </Card>

    <Card className="rounded-2xl border">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Total Pacientes Atendidos</CardTitle>
        <UserCheck className="h-5 w-5 text-green-500/50" />
      </CardHeader>
      <CardContent className="text-2xl sm:text-3xl font-bold">
        {summary.totalPatientsAttended}
      </CardContent>
    </Card>

    <Card className="rounded-2xl border">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Cancelamentos</CardTitle>
        <XCircle className="h-5 w-5 text-red-500/50" />
      </CardHeader>
      <CardContent className="text-2xl sm:text-3xl font-bold">
        {summary.cancelledAppointments}
      </CardContent>
    </Card>
  </div>

  <Card className="rounded-2xl border overflow-x-auto">
    <CardHeader className="flex items-center justify-between">
      <CardTitle>Próximos Agendamentos</CardTitle>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary">Ver todos</Button>
        </DialogTrigger>

        <DialogContent className="max-w-full sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Todos os Agendamentos</DialogTitle>
          </DialogHeader>

          <div className="overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((apt: FormattedAppointments) => (
                  <TableRow key={apt.id}>
                    <TableCell>{apt.patientName}</TableCell>
                    <TableCell>{apt.formattedDate}</TableCell>
                    <TableCell>{`${apt.startTime} - ${apt.endTime}`}</TableCell>
                    <TableCell>
                      <Badge variant={apt.status === "COMPLETED"
                        ? "default"
                        : apt.status === "CANCELLED"
                        ? "destructive"
                        : "secondary"}>{apt.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </CardHeader>

    <CardContent className="overflow-x-auto">
      <Table className="min-w-[500px]">
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {upcoming.map((apt: FormattedAppointments) => (
            <TableRow key={apt.id}>
              <TableCell>{apt.patientName}</TableCell>
              <TableCell>{apt.formattedDate}</TableCell>
              <TableCell>{`${apt.startTime} - ${apt.endTime}`}</TableCell>
              <TableCell>
                <Badge variant={apt.status === "COMPLETED"
                        ? "default"
                        : apt.status === "CANCELLED"
                        ? "destructive"
                        : "secondary"}>{apt.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>

  <Card className="rounded-2xl border">
    <CardHeader className="flex items-center justify-between">
      <CardTitle>Atendimentos Recentes</CardTitle>
      <UserCheck className="h-5 w-5 text-green-500/50" />
    </CardHeader>

    <CardContent>
      <div className="space-y-3">
        {recent.map((item: FormattedAppointments) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between border p-3 rounded-xl"
          >
            <div>
              <p className="font-medium">{item.patientName}</p>
              <p className="text-sm text-muted-foreground">{item.formattedDate}</p>
            </div>

            <Badge
              className="mt-2 sm:mt-0"
              variant={item.status === "COMPLETED"
                        ? "default"
                        : item.status === "CANCELLED"
                        ? "destructive"
                        : "secondary"}
            >
              {item.status}
            </Badge>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
</div>
  );
}
