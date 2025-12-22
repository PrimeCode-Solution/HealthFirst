"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro capturado no cliente:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="flex max-w-md flex-col items-center text-center space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10">
          <AlertTriangle className="h-10 w-10 text-yellow-600 dark:text-yellow-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Ops! Algo deu errado.
          </h1>
          <p className="text-muted-foreground text-lg">
            Não foi possível processar sua solicitação no momento. Nossos engenheiros já foram notificados.
          </p>
        </div>

        <div className="flex flex-col gap-2 min-[400px]:flex-row">
          <Button onClick={() => reset()} variant="default" size="lg" className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Tentar Novamente
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/dashboard">
              Voltar ao Início
            </Link>
          </Button>
        </div>
        
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-4">
            Código do erro: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}