"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { usePaymentStatus } from "@/presentation/payments/queries/usePaymentStatus";

function ProcessandoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [progressValue, setProgressValue] = useState(10);

  const mpStatus = searchParams.get("status");
  const paymentId = searchParams.get("payment_id");

  const { data: paymentData } = usePaymentStatus(paymentId);

  useEffect(() => {
    if (status === "loading") {
      const timer = setInterval(() => {
        setProgressValue((old) => (old >= 90 ? 90 : old + 5));
      }, 500);
      return () => clearInterval(timer);
    }
  }, [status]);

  useEffect(() => {
    if (paymentData?.status === "APPROVED") {
      setStatus("success");
      setProgressValue(100);
      toast.success("Pagamento aprovado!");
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } else if (paymentData?.status === "REJECTED") {
      setStatus("error");
      toast.error("Pagamento rejeitado.");
    }
  }, [paymentData, router]);

  useEffect(() => {
    if (paymentId) return;

    if (!mpStatus) {
        return;
    }

    if (mpStatus === "approved") {
      setStatus("success");
      setProgressValue(100);
      toast.success("Assinatura confirmada com sucesso!");
    } else if (mpStatus === "rejected" || mpStatus === "failure") {
      setStatus("error");
      toast.error("Houve um problema com o pagamento da assinatura.");
    }
  }, [mpStatus, paymentId]);

  if (status === "loading") {
    return (
      <>
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
        <p className="text-muted-foreground">Verificando status do pagamento...</p>
        <Progress value={progressValue} className="w-[60%] mt-4" />
      </>
    );
  }

  if (status === "success") {
    return (
      <>
        <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in duration-500" />
        <h2 className="text-xl font-bold text-green-700">Tudo Certo!</h2>
        <p className="text-muted-foreground">
          Sua assinatura foi ativada. Você será redirecionado em instantes.
        </p>
        <Button 
          className="mt-4 w-full" 
          onClick={() => router.push("/dashboard")}
        >
          Voltar ao Dashboard
        </Button>
      </>
    );
  }

  return (
    <>
      <XCircle className="h-16 w-16 text-red-500" />
      <h2 className="text-xl font-bold text-red-700">Pagamento Pendente ou Falhou</h2>
      <p className="text-muted-foreground">
        Não conseguimos confirmar a aprovação imediata. Se você pagou, aguarde alguns instantes.
      </p>
      <div className="flex flex-col w-full gap-2 mt-4">
          <Button 
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => router.push("/dashboard")}
          >
            Voltar
          </Button>
      </div>
    </>
  );
}

export default function AssinaturaProcessandoPage() {
  return (
    <div className="flex h-[80vh] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Processando Assinatura</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Suspense fallback={
            <>
              <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
              <p className="text-muted-foreground">Carregando...</p>
            </>
          }>
            <ProcessandoContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
