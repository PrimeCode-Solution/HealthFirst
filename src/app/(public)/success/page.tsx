import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function SucessPage({
  searchParams,
}: {
  searchParams: Promise<{
    collection_id?: string;
    collection_status?: string;
    payment_id?: string;
  }>;
}) {
  const params = await searchParams;
  const paymentId = params.payment_id ?? "indefinido";

  return (
    <main className="flex h-[calc(100vh-5rem-84px)] items-center justify-center">
      <Card className="m-5 p-6 text-center">
        <CardHeader className="flex flex-col items-center">
          <CheckCircle className="mb-2 h-15 w-15 text-green-500" />
          <CardTitle>Pagamento Confirmado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-700">
            Obrigado! Seu pagamento foi processado com sucesso.
          </p>
          <p className="mt-5 text-sm text-gray-500">
            <strong>ID do pagamento: </strong>
            {paymentId}
          </p>

          <Link href="/dashboard">
            <Button variant="default" className="mt-4 w-full">
              Ir para Meus Agendamentos
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
