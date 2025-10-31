import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import { createSubscriptionRepository } from "@/modules/subscriptons/infrastrutucture/subscriptionRepository";
import {toast} from "sonner";
import{
    CreateSubscriptionDTO,
    Subscription,
    SubscriptionStatus
} from "@/modules/subscriptons/domain/subscription.interface";
import {AxiosError} from "axios";

const subscriptionRepository = createSubscriptionRepository();

//Criar assinatura
export function useCreateSubscription(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSubscriptionDTO) =>
            subscriptionRepository.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey:["subscriptions"]});
            toast.success("Assinatura craida com sucesso!");
        },
        onError: (error: AxiosError) => {
            console.error("Erro ao criar assinatura: ", error);
            toast.error(error.message || "Erro ao criar assinatura");
        },
    });
}

//Cancelar assinatura
export function useCancelSubscription(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            subscriptionRepository.cancelSubscription(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["subscriptions"]});
            toast.success("Assinatura cancelada com sucesso!");
        },
        onError: (error: AxiosError) =>{
            console.error("Erro ao cancelar assinatura: ", error);
            toast.error(error.message || "Erro ao cancelar assinatura");
        },
    });
}

//Reativar assinatura
export function useReactiveSubscription(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            subscriptionRepository.updateSubscriptionStatus(id, SubscriptionStatus.ACTIVE),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["subscriptions"]});
            toast.success("Assinatura reativada com sucesso!");
        },
        onError: (error: AxiosError) => {
            console.error("Erro ao reativar assinatura: ", error);
            toast.error(error.message || "Erro ao reativar assinatura");
        },
    });
}
