"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

function ProcessandoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  const mpStatus = searchParams.get("status"); 

  useEffect(() => {
    if (!mpStatus) {
        setStatus("error");
        return;
    }

    if (mpStatus === "approved") {
      setStatus("success");
      toast.success("Assinatura confirmada com sucesso!");
    } else {
      setStatus("error");
      toast.error("Houve um problema com o pagamento da assinatura.");
    }
  }, [mpStatus]);

  if (status === "loading") {
    return (
      <>
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
        <p className="text-muted-foreground">Verificando status do pagamento...</p>
      </>
    );
  }

  if (status === "success") {
    return (
      <>
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="text-xl font-bold text-green-700">Tudo Certo!</h2>
        <p className="text-muted-foreground">
          Sua assinatura foi ativada. Você agora tem acesso aos recursos premium.
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

  // status === "error"
  return (
    <>
      <XCircle className="h-16 w-16 text-red-500" />
      <h2 className="text-xl font-bold text-red-700">Pagamento Pendente ou Falhou</h2>
      <p className="text-muted-foreground">
        Não conseguimos confirmar a aprovação imediata. Se você pagou, aguarde alguns instantes.
      </p>
      <div className="flex w-full gap-2 mt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => router.push("/dashboard")}
          >
            Voltar
          </Button>
          <Button 
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </Button>
      </div>
    </>
  );
}

// 2. O componente da página principal envolve o conteúdo em Suspense
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