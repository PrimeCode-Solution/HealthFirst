import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {  useUpdatePaymentMutation } from "@/presentation/payments/api/useUpdatePaymentMutation";
import { usePaymentById } from "@/presentation/payments/queries/usePaymentsQueries";
import { usePaymentMethods } from "@/presentation/payments/queries/usePaymentMethods";

const schema = z.object({

    amount: z.number().positive("O valor digitado deve ser positivo"),
    method: z.string().min(1, "Selecione um método de pagamento"),

    });

    type FormValues = z.infer<typeof schema>;

    export function UpdatePaymentForm({ paymentId}: { paymentId: string}){
        const { data:payment, isLoading: loadingPayment } = usePaymentById(paymentId);
        const { data: methods } = usePaymentMethods();
        const { mutate: updatePayment, isLoading:loadingUpdate } = useUpdatePaymentMutation();
        
        const form = useForm<FormValues>({
            resolver: zodResolver(schema),
            defaultValues: payment ? {
                amount: Number(payment.amount),
                method: payment.preferenceId,
            }

            : undefined
        });

        
        
        function onSubmit(data: FormValues){
            updatePayment({ id: paymentId, ...data });
        }

        if (loadingPayment){
            return <p>Carregandos para o pagamento...</p>;
        }

        if(!payment){
            return <p>Pagamento não encontrado.</p>;
        }

        return (
            <form onSubmit={form.handleSubmit(onSubmit)}>
             <input type="number" placeholder="Valor" 
             {...form.register("amount")} />
              
              <select {...form.register("method")}>
                <option value="">Selecione um método:</option>
                {methods?.map((m) => (
                    <option key={m.id} value={m.id}>
                       {m.payName}
                    </option>
                ))}
              </select>

             <button disabled={loadingUpdate}>
             {loadingUpdate ? "Atualizando...": "Atualizar Pagamento"}

             </button>
             </form>

        );
    }
