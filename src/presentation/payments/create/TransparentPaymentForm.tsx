"use client";
import { useEffect, useState, useRef } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, CreditCard, FileText } from "lucide-react"; 

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || process.env.NEXT_PUBLIC_MP_ACCESS_TOKEN || "";

interface TransparentPaymentFormProps {
    amount: number;
    appointmentId: string;
    userEmail?: string;
}

export default function TransparentPaymentForm({ amount, appointmentId, userEmail }: TransparentPaymentFormProps) {
    const router = useRouter();
    const [pixData, setPixData] = useState<{ qrCode: string; ticket: string } | null>(null);
    const [createdPaymentId, setCreatedPaymentId] = useState<string | null>(null);
    
    const [copied, setCopied] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    
    const startTimeRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (MP_PUBLIC_KEY) {
            initMercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
        } else {
            console.error("Public Key do Mercado Pago não encontrada!");
        }

        return () => stopPolling();
    }, []);

    const stopPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        if (!createdPaymentId) return;

        startTimeRef.current = Date.now();

        intervalRef.current = setInterval(async () => {
            try {
                if (Date.now() - (startTimeRef.current || 0) > 300000) {
                    stopPolling();
                    router.push("/failure"); 
                    return;
                }

                setIsChecking(true);
                const res = await fetch(`/api/payments/check-status?id=${createdPaymentId}`);
                const data = await res.json();
                setIsChecking(false);

                if (data.status === "CONFIRMED") {
                    stopPolling();
                    router.push(`/success?payment_id=${createdPaymentId}`);
                } else if (data.status === "CANCELLED" || data.status === "REJECTED") {
                    stopPolling();
                    router.push("/failure");
                }
            } catch (error) {
                console.error("Erro ao verificar status:", error);
            }
        }, 4000); 

        return () => stopPolling();
    }, [createdPaymentId, router]);

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
                const paymentId = data.id || data.mercadoPagoId;

                if (data.status === "approved") {
                    router.push(`/success?payment_id=${paymentId}`); 
                    resolve();
                    return;
                }

                if (paymentId) {
                    setCreatedPaymentId(String(paymentId));
                }

                const pixInfo = data.point_of_interaction?.transaction_data;
                if (pixInfo?.qr_code && pixInfo?.qr_code_base64) {
                    setPixData({ 
                        qrCode: pixInfo.qr_code_base64, 
                        ticket: pixInfo.qr_code
                    });
                }
                
                resolve(); 
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


    if (createdPaymentId) {
        return (
            <div className="payment-container w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
                {pixData ? (
                    <>
                        <h2 className="text-xl font-bold mb-4 text-center">Pague com PIX</h2>
                        <div className="flex flex-col items-center space-y-6 animate-in fade-in duration-500">
                            <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-center w-full text-sm">
                                <p className="font-bold mb-1">Pagamento Gerado!</p>
                                Aguardando confirmação automática...
                            </div>
                            
                            <div className="border-2 border-gray-100 p-2 rounded-lg bg-white shadow-sm relative">
                                <img 
                                    src={`data:image/png;base64,${pixData.qrCode}`} 
                                    alt="QR Code PIX" 
                                    className={`w-56 h-56 object-contain ${isChecking ? 'opacity-50' : ''}`}
                                />
                                {isChecking && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                    </div>
                                )}
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
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in">
                        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                        <h2 className="text-xl font-bold text-gray-800">Processando Pagamento</h2>
                        <p className="text-center text-gray-600 max-w-xs">
                            Estamos confirmando sua transação. Por favor, aguarde alguns instantes, você será redirecionado automaticamente.
                        </p>
                        {isChecking && <span className="text-xs text-gray-400">Verificando status...</span>}
                    </div>
                )}

                <div className="text-xs text-center text-gray-400 mt-6">
                    <p>Atualização automática a cada 4 segundos.</p>
                </div>

                <div className="w-full pt-4 mt-4 border-t border-gray-100">
                    <button 
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
                    >
                        Voltar para o Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-container w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-center">Finalizar Pagamento</h2>
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