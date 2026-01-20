"use client";
import { useEffect } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useRouter } from "next/navigation";

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || process.env.NEXT_PUBLIC_MP_ACCESS_TOKEN || "";

interface TransparentPaymentFormProps {
    amount: number;
    appointmentId: string;
    userEmail?: string;
}

export default function TransparentPaymentForm({ amount, appointmentId, userEmail }: TransparentPaymentFormProps) {
    const router = useRouter();

    useEffect(() => {
        if (MP_PUBLIC_KEY) {
            initMercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
        } else {
            console.error("Public Key do Mercado Pago não encontrada!");
        }
    }, []);

    const initialization = {
        amount: amount,
        payer: {
            email: userEmail || "email_generico@teste.com",
            entityType: "individual" as "individual", 
        },
    };

    const customization = {
        paymentMethods: {
            ticket: "all",
            bankTransfer: "all",
            creditCard: "all",
            debitCard: "all",
            mercadoPago: "all",
        },
        visual: {
            style: {
                theme: "bootstrap", 
            }
        }
    } as const;

    const onSubmit = async ({ formData }: any) => {
        return new Promise<void>((resolve, reject) => {
            fetch("/api/payments/process", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    formData,
                    appointmentId: appointmentId
                }),
            })
            .then((response) => response.json())
            .then((data) => {
                if (data.status === "approved" || data.status === "in_process" || data.status === "pending") {
                    const paymentId = data.id || data.mercadoPagoId;
                    router.push(`/success?payment_id=${paymentId}`); 
                    resolve();
                } else {
                    console.error("Erro no pagamento:", data);
                    resolve(); 
                }
            })
            .catch((error) => {
                console.error("Erro de conexão:", error);
                reject();
            });
        });
    };

    const onError = async (error: any) => {
        console.error("Erro no Brick:", error);
    };

    const onReady = async () => {
    };

    if (!MP_PUBLIC_KEY) return <div>Erro: Configure a chave pública do MP.</div>;

    return (
        <div className="payment-container w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Finalizar Pagamento</h2>
            <Payment
                initialization={initialization}
                customization={customization}
                onSubmit={onSubmit}
                onReady={onReady}
                onError={onError}
            />
        </div>
    );
}