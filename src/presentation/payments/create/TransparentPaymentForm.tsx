"use client";
import { useEffect, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react"; 

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || process.env.NEXT_PUBLIC_MP_ACCESS_TOKEN || "";

interface TransparentPaymentFormProps {
    amount: number;
    appointmentId: string;
    userEmail?: string;
}

export default function TransparentPaymentForm({ amount, appointmentId, userEmail }: TransparentPaymentFormProps) {
    const router = useRouter();
    const [pixData, setPixData] = useState<{ qrCode: string; ticket: string } | null>(null);
    const [copied, setCopied] = useState(false);

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
                const pixInfo = data.point_of_interaction?.transaction_data;

                if (pixInfo?.qr_code && pixInfo?.qr_code_base64) {
                    setPixData({ 
                        qrCode: pixInfo.qr_code_base64, 
                        ticket: pixInfo.qr_code 
                    });
                    resolve(); 
                    return; 
                }

                if (data.status === "approved" || data.status === "in_process" || data.status === "pending") {
                    const paymentId = data.id || data.mercadoPagoId;
                    router.push(`/success?payment_id=${paymentId}`); 
                    resolve();
                } else {
                    console.error("Status do pagamento:", data);
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

    const handleCopyPix = () => {
        if (pixData?.ticket) {
            navigator.clipboard.writeText(pixData.ticket);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!MP_PUBLIC_KEY) return <div>Erro: Configure a chave pública do MP.</div>;

    return (
        <div className="payment-container w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-center">
                {pixData ? "Pague com PIX" : "Finalizar Pagamento"}
            </h2>
            
            {pixData ? (
                <div className="flex flex-col items-center space-y-6 animate-in fade-in duration-500">
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-center w-full text-sm">
                        <p className="font-bold mb-1">Pagamento Gerado!</p>
                        Escaneie o QR Code abaixo ou copie o código para pagar no aplicativo do seu banco.
                    </div>
                    
                    {/* Imagem do QR Code */}
                    <div className="border-2 border-gray-100 p-2 rounded-lg bg-white shadow-sm">
                        <img 
                            src={`data:image/png;base64,${pixData.qrCode}`} 
                            alt="QR Code PIX" 
                            className="w-56 h-56 object-contain"
                        />
                    </div>

                    <div className="w-full space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Código Copia e Cola
                        </label>
                        <div className="flex gap-2">
                             <input 
                                readOnly 
                                value={pixData.ticket} 
                                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-xs bg-gray-50 text-gray-600 focus:outline-none"
                             />
                             <button 
                                onClick={handleCopyPix}
                                className={`px-4 py-2 rounded-md text-white text-sm font-medium transition-colors ${copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                             >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                             </button>
                        </div>
                    </div>

                    <div className="w-full pt-4 border-t border-gray-100">
                        <p className="text-xs text-center text-gray-400 mb-4">
                            Após realizar o pagamento no banco, clique abaixo.
                        </p>
                        <button 
                            onClick={() => router.push('/dashboard')}
                            className="w-full py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
                        >
                            Já realizei o pagamento
                        </button>
                    </div>
                </div>
            ) : (
                <Payment
                    initialization={initialization}
                    customization={customization}
                    onSubmit={onSubmit}
                    onReady={onReady}
                    onError={onError}
                />
            )}
        </div>
    );
}