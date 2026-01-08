"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Search, History, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"; // Adicionado para feedback visual

interface HistoryItem {
  id: string;
  date: string;
  archivedAt: string;
  status: string;
  reason: string;
  amount: number;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  doctor: {
    name: string;
  } | null;
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch("/api/admin/history");
        
        if (!res.ok) {
            throw new Error(`Erro ${res.status}: Falha ao buscar dados.`);
        }

        const jsonData = await res.json();

        // VALIDAÇÃO CRÍTICA: Só aceita se for array
        if (Array.isArray(jsonData)) {
            setData(jsonData);
        } else {
            console.error("Resposta da API inválida:", jsonData);
            setData([]); // Garante que não quebra a tela
            toast.error("Erro no formato dos dados recebidos.");
        }

      } catch (err) {
        console.error(err);
        toast.error("Não foi possível carregar o histórico.");
        setData([]); // Em caso de erro, mantém array vazio
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const getWhatsappLink = (phone: string | null) => {
    if (!phone) return "#";
    const cleanPhone = phone.replace(/\D/g, "");
    return `https://wa.me/55${cleanPhone}`;
  };

  const translateReason = (reason: string) => {
    // Tratamento para caso reason venha nulo ou undefined do banco
    const safeReason = reason || "DESCONHECIDO";

    if (safeReason === "FINISHED_CONSULTATION") {
        return { 
            text: "Consulta Realizada (Concluída)", 
            color: "bg-emerald-100 text-emerald-700 border-emerald-200" 
        };
    }
    if (safeReason.includes("APPROVE_REFUND_SUCCESS")) return { text: "Reembolso Aprovado e Efetuado", color: "bg-green-100 text-green-700 border-green-200" };
    if (safeReason.includes("REJECT_REFUND")) return { text: "Reembolso Negado", color: "bg-red-100 text-red-700 border-red-200" };
    if (safeReason.includes("MANUAL_PATIENT")) return { text: "Cancelado pelo Paciente", color: "bg-gray-100 text-gray-700 border-gray-200" };
    if (safeReason.includes("MANUAL_ADMIN")) return { text: "Cancelado pelo Admin", color: "bg-blue-100 text-blue-700 border-blue-200" };
    if (safeReason.includes("REVIEW_REQUIRED")) return { text: "Enviado para Análise", color: "bg-orange-100 text-orange-700 border-orange-200" };
    if (safeReason === "REQUEST_REVIEW_APPROVE_REFUND_NOT_APPLICABLE") {
        return { 
            text: "Aprovado (Sem estorno: pagamento ausente ou outro motivo)", 
            color: "bg-blue-50 text-blue-700 border-blue-200" 
        };
    }
    
    return { text: safeReason, color: "bg-slate-100 text-slate-700 border-slate-200" };
  };

  const safeData = Array.isArray(data) ? data : [];

  const filteredData = safeData.filter(item => {
    const name = item.user?.name?.toLowerCase() || "";
    const reason = item.reason?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return name.includes(term) || reason.includes(term);
  });

  if (loading) return (
      <div className="flex items-center justify-center h-96 text-muted-foreground animate-pulse">
          Carregando histórico...
      </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8 text-muted-foreground" />
            Histórico de Eventos
        </h1>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-4">
          <CardTitle>Auditoria de Consultas</CardTitle>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Buscar por paciente ou motivo..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data do Evento</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico Original</TableHead>
                <TableHead>Motivo / Resultado</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-2">
                              <AlertTriangle className="h-6 w-6 text-yellow-500/50" />
                              <p>Nenhum registro encontrado.</p>
                          </div>
                      </TableCell>
                  </TableRow>
              ) : (
                  filteredData.map((item) => {
                    const reasonInfo = translateReason(item.reason);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">
                            {format(new Date(item.archivedAt), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(item.archivedAt), "HH:mm", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell>
                            <div className="font-medium">{item.user?.name || "Usuário Deletado"}</div>
                            <div className="text-xs text-muted-foreground">{item.user?.email || "-"}</div>
                        </TableCell>
                        <TableCell>{item.doctor?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-normal ${reasonInfo.color}`}>
                            {reasonInfo.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                            R$ {Number(item.amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {item.user?.phone && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => window.open(getWhatsappLink(item.user.phone), '_blank')}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Retenção
                              </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}