"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Stethoscope, Baby, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransparentSubscriptionForm } from "@/presentation/subscriptions/create/TransparentSubscriptionForm";

export default function ConsutaPediatricaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasAccess } = usePremiumAccess(session?.user?.id);
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    fetch("/api/ebooks?category=Pediatria")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setEbooks(res.data);
      });
  }, []);

  const handleAction = (ebook: any) => {
    if (ebook.isPremium && !hasAccess) {
      if (status === "unauthenticated") {
        toast.error("Faça login para assinar.");
        router.push("/login?callbackUrl=/consulta-pediatrica");
        return;
      }
      setSelectedPlan({ title: "Assinatura Premium Pediatria", price: 29.90 });
    } else {
      window.open(ebook.downloadUrl, "_blank");
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, "_blank");
  };

  const gratuitos = ebooks.filter((e) => !e.isPremium);
  const premium = ebooks.filter((e) => e.isPremium);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-6 w-full">
        <section className="grid grid-cols-1 gap-6 mb-12 mt-8">
          <div className="relative w-full mx-auto overflow-hidden rounded-xl">
            <Image width={1500} height={1000} alt="Capa" src="/pediatria.png" className="w-full h-[35rem] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/70">
              <div className="absolute inset-0 flex flex-col justify-center px-8">
                <h1 className="mb-2 text-5xl font-bold tracking-tight text-white">
                  Cuidados pediátricos especializados para a saúde do seu filho
                </h1>
                <p className="mb-3 font-normal text-white max-w-2xl">
                  Na HealthFirst, oferecemos atendimento para crianças de todas as idades. Nossa equipe se dedica a garantir o bem-estar do seu filho.
                </p>
                <Link href="/agendar-consulta" className="inline-block text-center items-center px-4 py-3 w-48 text-sm font-bold text-black bg-[var(--primary)] rounded-lg hover:scale-105 transition-transform">
                  Agende uma consulta
                </Link>
              </div>
            </div>
          </div>

          <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">Nossos serviços pediátricos</h2>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
            <Card className="flex flex-col p-6 gap-2">
              <Stethoscope /> <h2 className="text-xl font-bold">Rotina</h2>
              <p className="text-[var(--chart-2)]">Check-ups regulares para monitorar o desenvolvimento.</p>
            </Card>
            <Card className="flex flex-col p-6 gap-2">
              <Baby /> <h2 className="text-xl font-bold">Recém-nascido</h2>
              <p className="text-[var(--chart-2)]">Cuidados especializados para bebês.</p>
            </Card>
            <Card className="flex flex-col p-6 gap-2">
              <Heart /> <h2 className="text-xl font-bold">Saúde do adolescente</h2>
              <p className="text-[var(--chart-2)]">Apoio e orientação para jovens.</p>
            </Card>
          </section>

          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mt-8">Recursos gratuitos para pais</h2>
          {gratuitos.map((eb) => (
            <div key={eb.id} className="flex flex-col md:flex-row items-center gap-4 my-6">
              <div className="flex-1">
                <h3 className="block max-w-sm text-[var(--chart-2)]">E-book Gratuito</h3>
                <h3 className="mb-2 text-xl font-bold tracking-tight text-gray-900">{eb.title}</h3>
                <p className="mb-4 text-[var(--chart-2)]">{eb.description}</p>
                <button className="px-4 py-2 bg-gray-100 rounded-md text-black font-bold hover:bg-gray-300 transition-colors" onClick={() => handleDownload(eb.downloadUrl)}>
                  Baixar Agora
                </button>
              </div>
              <div className="w-[280px] h-40 flex-shrink-0 relative">
                <Image src={eb.coverUrl || "/card_image1.png"} fill alt={eb.title} className="object-cover rounded-lg" />
              </div>
            </div>
          ))}

          <section className="mt-12">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">Conteúdo Premium de Pediatria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {premium.map((eb) => (
                <article key={eb.id} className="flex flex-col rounded-lg border bg-white p-4 shadow-sm">
                  <div className="relative mb-3 h-48 w-full">
                    <Image src={eb.coverUrl || "/pediatria.png"} alt={eb.title} fill className="rounded-md object-cover" />
                  </div>
                  <h3 className="mb-1 text-base font-semibold">{eb.title}</h3>
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-3">{eb.description}</p>
                  <button
                    onClick={() => handleAction(eb)}
                    className={`mt-auto rounded-md px-3 py-2 text-sm font-bold text-white transition-all ${
                      hasAccess ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {hasAccess ? "Baixar e-book" : "Assinar para Desbloquear"}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-12 p-8 bg-gray-50 rounded-2xl border border-gray-100">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Agende uma consulta</h2>
            <p className="mb-6">Discuta as questões de saúde do seu filho e receba orientação personalizada.</p>
            <Link href="/agendar-consulta" className="inline-block text-center px-6 py-3 bg-[var(--primary)] rounded-md text-black font-bold hover:scale-105 transition-transform">
              Marcar consulta
            </Link>
          </div>
        </section>

        <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Finalizar Assinatura</DialogTitle></DialogHeader>
            {selectedPlan && session?.user && (
              <TransparentSubscriptionForm 
                userId={session.user.id} 
                userEmail={session.user.email!} 
                planName={selectedPlan.title} 
                amount={selectedPlan.price} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}