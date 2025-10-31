import { useQuery } from "@tanstack/react-query";
import {createSubscriptionRepository} from "@/modules/subscriptons/infrastrutucture/subscriptionRepository";
import type { Subscription } from "@/modules/subscriptons/domain/subscription.interface";

const subscriptionRepository = createSubscriptionRepository();

//Buscar assinatura por ID
export function useGetSubscription(id: string){
    return useQuery ({
        queryKey: ["subscriptions", id],
        queryFn: () => subscriptionRepository.findById(id),
        enabled: !!id,
    });
}

//Busca por assinatura do usuário 
export function useGeUsertSubscription(userId: string){
    return useQuery({
        queryKey: ["subscriptions-user", userId],
        queryFn: () => subscriptionRepository.findAll()
        .then(subs => subs.find(sub => sub.userId === userId)),
        enabled: !!userId,
    });
}

//Buscar historico de assinatura
export function useGetSubscriptionHistory(userId: string){
    return useQuery({
        queryKey: ["subscriptions-history", userId],
        queryFn: () => subscriptionRepository.findAll()
        .then(subs => subs.filter(subs => subs.userId === userId)),
        enabled: !!userId,
    });
}