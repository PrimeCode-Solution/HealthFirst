import type{
    Subscription,
    CreateSubscriptionDTO,
    UpdateSubscriptionDTO,
    SubscriptionStatus
} from "../domain/subscription.interface";
import { ISubscriptionRepository } from "../domain/subscription.repository";
import api from "@/lib/api";

export function createSubscriptionRepository(): ISubscriptionRepository & {
    cancelSubscription: typeof cancelSubscription;
    updateSubscriptionStatus: typeof updateSubscriptionStatus;
} {
    return {
    create,
    findAll,
    findById,
    update,
    delete: deleteSubscription,
    cancelSubscription,
    updateSubscriptionStatus,
    };
}
async function create(data: CreateSubscriptionDTO): Promise<Subscription> {
    const response = await api.post<Subscription>("/subscriptions", data);
    return response.data;
}

async function findAll(): Promise<Subscription[]>{
    const response = await api.get<Subscription[]> ("/subscriptions");
    return response.data;
}

async function findById(id: string): Promise<Subscription | null> {
    const response = await api.get<Subscription>(`/subscriptions/${id}`);
    return response.data;
}

async function update(
    id: string,
    data: UpdateSubscriptionDTO,
): Promise<Subscription> {
    const response = await api.patch<Subscription>(`/subscriptions/${id}`, data);
    return response.data;
}
    async function deleteSubscription(id: string): Promise<void>{
        await api.delete(`/subscriptions/${id}`);
    }

    async function cancelSubscription(id: string): Promise<Subscription>{
    const response = await api.post<Subscription>(`/subscriptions/${id}/cancel`);
    return response.data;
    }

    async function updateSubscriptionStatus(
        id: string,
        status: SubscriptionStatus
    ): Promise<Subscription>{
        const response = await api.patch<Subscription>(`/subscriptions/${id}/status`, {status});
        return response.data;
    }