"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useDashboardStats } from "@/presentation/dashboard/queries/useDashboardStats";
import { ptBR } from "react-day-picker/locale";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";


import { 
  Users, 
  Calendar as CalendarIcon, 
  DollarSign, 
} from "lucide-react";

// Charts
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend 
} from "recharts";

const clientMessages = [
  {
    id: 1,
    name: "Sarah Thompson",
    message: "Urgente: Necessário acompanhamento",
    avatar: "/placeholder.svg?height=40&width=40",
    urgent: true,
  },
  {
    id: 2,
    name: "Mark Johnson",
    message: "Consulta geral",
    avatar: "/placeholder.svg?height=40&width=40",
    urgent: false,
  },
  {
    id: 3,
    name: "Emily Davis",
    message: "Remarcação de consultas",
    avatar: "/placeholder.svg?height=40&width=40",
    urgent: false,
  },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
const statusMap: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído"
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: stats, isLoading, error } = useDashboardStats();

  if (!isAdmin) {
    return (
      <div className="flex h-screen">
        <div className="flex-1">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Bem-vindo, {session?.user?.name?.split(" ")[0]}
              </h1>
              <p className="text-gray-500">Aqui estão seus próximos agendamentos.</p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr]">
              {/* Calendário */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Selecione uma data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    locale={ptBR}
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="w-full rounded-lg"
                    classNames={{
                      day_selected: "bg-green-500 text-white hover:bg-green-600",
                      day_today: "bg-gray-100 text-gray-900",
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Consultas agendadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clientMessages.map((message) => (
                      <div
                        key={message.id}
                        className="flex items-start space-x-4 rounded-lg p-3 transition-colors hover:bg-gray-50"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={message.avatar || "/placeholder.svg"}
                            alt={message.name}
                          />
                          <AvatarFallback>
                            {message.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {message.name}
                          </p>
                          <p
                            className={`mt-1 text-sm ${
                              message.urgent ? "font-medium text-green-600" : "text-gray-500"
                            }`}
                          >
                            {message.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }


  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="p-8 text-red-500">Erro ao carregar dados do dashboard.</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard Analítico</h1>
        <p className="text-muted-foreground">Visão geral do desempenho da clínica.</p>
      </div>


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.overview.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Receita total aprovada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Total de usuários cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Totais</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">Histórico completo</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        

        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>Faturamento aprovado nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.charts.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={10}
                    fontSize={12}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    fontSize={12}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    formatter={(value: number) => [
                        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 
                        'Receita'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Status dos Agendamentos</CardTitle>
            <CardDescription>Distribuição por situação atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.charts.appointmentsByStatus.map(item => ({
                        ...item,
                        name: statusMap[item.status] || item.status
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {stats?.charts.appointmentsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
        <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-7">
            <Skeleton className="col-span-4 h-[400px] rounded-xl" />
            <Skeleton className="col-span-3 h-[400px] rounded-xl" />
        </div>
    </div>
  );
}