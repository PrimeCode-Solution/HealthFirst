"use client";
import { useEffect } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useRouter } from "next/navigation";

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || "SUA_PUBLIC_KEY_AQUI";

interface TransparentPaymentFormProps {
    amount: number;
    appointmentId: string;
    userEmail?: string;
}

export default function TransparentPaymentForm({ amount, appointmentId, userEmail }: TransparentPaymentFormProps) {
    const router = useRouter();

    useEffect(() => {
        initMercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
    }, []);

    const initialization = {
        amount: amount,
        payer: {
            email: userEmail,
        },
    };

    // CORREÇÃO: Adicionado 'as const' para garantir que "all" seja tratado como literal e não string genérica
    const customization = {
        paymentMethods: {
            ticket: "all",
            bankTransfer: "all",
            creditCard: "all",
            debitCard: "all",
            mercadoPago: "all",
        },
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
                if (data.status === "approved" || data.status === "in_process") {
                    router.push("/success"); 
                    resolve();
                } else {
                    console.error("Erro no pagamento", data);
                    reject();
                }
            })
            .catch((error) => {
                console.error("Erro na requisição", error);
                reject();
            });
        });
    };

    const onError = async (error: any) => {
        console.log("Erro no Brick:", error);
    };

    const onReady = async () => {
    };

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