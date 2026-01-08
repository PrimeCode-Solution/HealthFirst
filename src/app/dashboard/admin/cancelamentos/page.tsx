"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface RequestType {
  id: string;
  reason: string;
  requestedAt: string;
  appointment: {
    date: string;
    startTime: string;
    user: {
      name: string;
      email: string;
      phone: string;
    };
    payment: {
      amount: string;
      status: string;
      mercadoPagoId: string | null;
    } | null;
  };
}

export default function CancellationRequestsPage() {
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/cancellation-requests");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Erro ao buscar solicitações", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDecision = async (requestId: string, action: "APPROVE" | "REJECT") => {
    const confirmMsg = action === "APPROVE" 
      ? "Isso irá estornar o valor para o cliente. Confirmar?" 
      : "O cliente NÃO receberá o reembolso. Confirmar?";
      
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/admin/cancellation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, adminNotes: `Decisão via Painel: ${action}` }),
      });
      
      const data = await res.json();

      if (data.success) {
        toast.success(action === "APPROVE" ? "Reembolso aprovado!" : "Solicitação rejeitada.");
        fetchRequests(); // Recarrega a lista
      } else {
        toast.error("Erro ao processar.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    }
  };

  if (loading) return <div className="p-8">Carregando solicitações...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Solicitações de Cancelamento</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendentes de Análise (Regra das 24h)</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mb-2 text-green-500" />
              <p>Nenhuma solicitação pendente.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Agendamento</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium">{req.appointment.user.name}</div>
                      <div className="text-xs text-muted-foreground">{req.appointment.user.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {format(new Date(req.appointment.date), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {req.appointment.startTime}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate" title={req.reason || ""}>
                      {req.reason}
                    </TableCell>
                    <TableCell>
                      R$ {Number(req.appointment.payment?.amount || 0).toFixed(2)}
                      {req.appointment.payment?.status === "APPROVED" && (
                        <Badge variant="outline" className="ml-2 text-green-600 border-green-200 bg-green-50">Pago</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleDecision(req.id, "APPROVE")}
                        >
                          Aprovar Reembolso
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDecision(req.id, "REJECT")}
                        >
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}