"use client";

import React, { useEffect, useState, useRef } from "react";
import { loadMercadoPago } from "@mercadopago/sdk-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";
import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export function TransparentSubscriptionForm({ 
  userId, 
  userEmail, 
  planName, 
  amount 
}: { 
  userId: string; 
  userEmail: string; 
  planName: string; 
  amount: number; 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const brickControllerRef = useRef<any>(null);
  
  const containerId = useRef(`payment-brick-container-${Math.floor(Math.random() * 10000)}`);

  useEffect(() => {
    let isMounted = true;

    const initMP = async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (!isMounted) return;

      const container = document.getElementById(containerId.current);
      if (!container) {
        console.error(`Container ${containerId.current} não encontrado.`);
        return;
      }

      await loadMercadoPago();
      
      const mpPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
      if (!mpPublicKey) {
        toast.error("Erro de configuração: Chave pública não encontrada.");
        return;
      }

      const safeEmail = userEmail && userEmail.includes("@") 
        ? userEmail 
        : "cliente_sem_email@healthfirst.com";

      const mp = new (window as any).MercadoPago(mpPublicKey, {
        locale: "pt-BR",
      });

      const bricksBuilder = mp.bricks();

      const renderCardPaymentBrick = async (bricksBuilder: any) => {
        const settings = {
          initialization: {
            amount: Number(amount),
            payer: {
              email: safeEmail, 
            },
          },
          customization: {
            visual: {
              style: {
                theme: "default", 
              },
            },
            paymentMethods: {
              creditCard: "all",
              maxInstallments: 1, 
            },
          },
          callbacks: {
            onReady: () => {
              console.log("Formulário de cartão carregado com sucesso.");
            },
            onSubmit: async (cardFormData: any) => {
              if (!isMounted) return;
              setLoading(true);
              try {
                await processSubscription(cardFormData, safeEmail);
              } catch (error) {
                console.error(error);
                setLoading(false);
              }
            },
            onError: (error: any) => {
              console.error("Erro interno do Brick:", error);
            },
          },
        };

        try {
          if (brickControllerRef.current) {
            try {
               await brickControllerRef.current.unmount(); 
            } catch (e) { /* ignore */ }
          }
          
          const controller = await bricksBuilder.create(
            "cardPayment",
            containerId.current, 
            settings
          );
          
          if (isMounted) {
             brickControllerRef.current = controller;
          }
        } catch (e) {
          console.error("Falha fatal ao criar Brick:", e);
        }
      };

      await renderCardPaymentBrick(bricksBuilder);
    };

    initMP();

    return () => {
      isMounted = false;
      if (brickControllerRef.current) {
        brickControllerRef.current.unmount().catch(() => {});
        brickControllerRef.current = null;
      }
    };
  }, [amount, userEmail]);

  const processSubscription = async (cardFormData: any, safeEmail: string) => {
    try {
      console.log("Enviando token:", cardFormData.token); 

      const response = await api.post("/subscriptions/checkout", {
        token: cardFormData.token,
        issuer_id: cardFormData.issuer_id,
        payment_method_id: cardFormData.payment_method_id,
        payer: {
          email: cardFormData.payer.email || safeEmail,
          identification: cardFormData.payer.identification,
        },
        planName,
        price: amount,
        userId
      });

      if (response.status === 200 || response.data.status === "authorized") {
         toast.success("Assinatura realizada com sucesso!");
         router.push("/dashboard/assinatura/processando?status=approved");
      } else {
         toast.error("Pagamento não autorizado. Tente outro cartão.");
      }

    } catch (error: any) {
      console.error("Erro ao processar assinatura:", error);
      const msg = error.response?.data?.error || error.message || "Erro desconhecido";
      toast.error(`Erro: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-lg">
           <Lock className="w-5 h-5 text-green-600" />
           Pagamento Seguro
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            Plano: <strong>{planName}</strong> <br/>
            Total: <strong>R$ {amount?.toFixed(2)}</strong>/mês
        </div>

        <div id={containerId.current}></div>

        {loading && (
          <div className="flex items-center justify-center mt-4 text-blue-600 bg-white/80 absolute inset-0 z-50">
            <Loader2 className="w-8 h-8 animate-spin mr-2" />
            <span className="font-semibold">Processando assinatura...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}