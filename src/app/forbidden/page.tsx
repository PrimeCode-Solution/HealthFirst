import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="flex max-w-md flex-col items-center text-center space-y-6">
        {/* Ícone de Alerta */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Acesso Negado
          </h1>
          <p className="text-muted-foreground text-lg">
            Você não tem permissão para acessar esta página. Se acredita que isso é um erro, entre em contato com o suporte.
          </p>
        </div>

        <div className="flex flex-col gap-2 min-[400px]:flex-row">
          <Button asChild variant="default" size="lg">
            <Link href="/dashboard">
              Voltar ao Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              Ir para o Início
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}