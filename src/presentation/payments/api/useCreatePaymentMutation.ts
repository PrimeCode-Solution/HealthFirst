import { useMutation } from "@tanstack/react-query";
import api  from "@/lib/api";
import { useState } from "react";

type CreatePaymentInput = {
    amount: number;
    method: string;
}

export function useCreatePaymentMutation() {
    const [isLoading, setIsLoading] = useState(false);
    
    async function mutate(payload: CreatePaymentInput) {
        setIsLoading(true);
           try{
            const response = await fetch("/payments", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
                });
            
            if(!response.ok) throw new Error("Failed to create payment");

            return await response.json();

            }catch (error) {
                // Antes: `throw new Error(Error.arguments)` — destruía o erro real.
                throw error instanceof Error ? error : new Error("Failed to create payment");

            } finally {
            setIsLoading(false);
        }
    }

    return { mutate, isLoading };
    
}