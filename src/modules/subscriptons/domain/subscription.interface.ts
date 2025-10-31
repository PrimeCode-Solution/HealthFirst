//import { SubscriptionStatus } from "@/generated/prisma";

export enum SubscriptionStatus{
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    CANCELLED = 'cancelled',
    PENDING = 'pending'
}

export interface Subscription{
    id: string;
    userId: string;
    mercadoPagoId?: string;
    preapprovalId: string;
    planName?: string; 
    amount?: number;
    currency: string;
    status: SubscriptionStatus;
}
//Definir DTOs para criação 
export interface CreateSubscriptionDTO{
    userId: string;
    mercadoPagoId?: string;
    preapprovalId: string;
    planName?: string;
    amount?: number;
    currency: string;
}
//Definir DTOs para Atualização
export interface UpdateSubscriptionDTO{
    planName?: string;
    amount?: number;
    currency?: string;
    status?: SubscriptionStatus;
}
