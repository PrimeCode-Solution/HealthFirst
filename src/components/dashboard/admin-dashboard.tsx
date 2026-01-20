"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign, Users, Calendar as CalendarIcon, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF4444', '#8884d8'];

export function AdminDashboard() {
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");

  const { data: doctorsList } = useQuery({
    queryKey: ["doctors-list-filter"],
    queryFn: async () => {
      const res = await api.get("/users?role=DOCTOR");
      return res.data.data.users;
    },
    refetchInterval: 10000,
  });

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ["admin-analytics-full", dateStart, dateEnd, selectedDoctor],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateStart) params.append("dateStart", dateStart);
      if (dateEnd) params.append("dateEnd", dateEnd);
      if (selectedDoctor && selectedDoctor !== "all") params.append("doctorId", selectedDoctor);
      
      const res = await api.get(`/admin/analytics?${params.toString()}`);
      return res.data;
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  const summary = analytics?.summary;
  const pieData = analytics?.charts?.cancellationReasons || [];
  const monthlyData = analytics?.charts?.monthlyData || [];
  const doctorStats = analytics?.doctors || [];

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Analítico</h2>
          <p className="text-muted-foreground">Visão geral financeira e operacional.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos os Médicos" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Médicos</SelectItem>
                    {doctorsList?.map((doc: any) => (
                        <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input type="date" className="w-auto" value={dateStart} onChange={e => setDateStart(e.target.value)} />
            <Input type="date" className="w-auto" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
            <Button onClick={() => refetch()}>Filtrar</Button>
        </div>
      </div>

      {/* Cards de KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
                {formatCurrency(summary?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Receita confirmada</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Perdida</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary?.lostRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Em cancelamentos/reembolsos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Totais</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalAppointments || 0}</div>
            <p className="text-xs text-muted-foreground">Ativos e Histórico</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground">Base de clientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Financeiro: Receita vs Perda</CardTitle>
            <CardDescription>Comparativo mensal de faturamento e cancelamentos.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar name="Faturamento" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar name="Perda (Cancelados)" dataKey="lost" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Motivos de Cancelamento</CardTitle>
            <CardDescription>Distribuição por causa registrada</CardDescription>
          </CardHeader>
          <CardContent>
             {pieData.length > 0 ? (
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                 </ResponsiveContainer>
             ) : (
                 <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                     Sem dados de cancelamento
                 </div>
             )}
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Performance por Médico</CardTitle>
              <CardDescription>Eficiência e resultado financeiro líquido.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                {doctorStats.map((doc: any) => {
                    const netBalance = (doc.revenueAmount || 0) - (doc.lostAmount || 0);
                    
                    return (
                        <div key={doc.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {doc.name.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium">{doc.name}</p>
                                    <p className="text-sm text-muted-foreground">{doc.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-8 text-right">
                                <div>
                                    <p className="text-sm font-medium text-green-600">Atendidos</p>
                                    <p className="text-xl font-bold">{doc.attended}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-red-600">Cancelados</p>
                                    <p className="text-xl font-bold">{doc.cancelledTotal}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-blue-600">Saldo Líquido</p>
                                    <p className={`text-xl font-bold ${netBalance < 0 ? 'text-red-500' : 'text-blue-700'}`}>
                                        {formatCurrency(netBalance)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">(Receita - Perda)</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {doctorStats.length === 0 && <p className="text-center text-muted-foreground py-4">Nenhum dado encontrado para o período.</p>}
              </div>
          </CardContent>
      </Card>
    </div>
  );
}