export interface Payment{
    id: string;
    appointmentId?: string;
    subscriptionId?: string;
    mercadoPagoId?: string;
    preferenceId?: string;
    amount: number;
    currency: string;
    description: string;
    status: PaymentStatus;
    payerEmail?: string;
    payName?: string;
    payPhine?: string;
}

export enum PaymentStatus{
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED",
    IN_PROCESS = "IN_PROCESS",
}

export interface CreatePaymentDTO {
    appointmentId?: string;
    subscriptionId?: string;
    mercadoPagoId?: string;
    preferenceId?: string;
    amount: number;
    currency: string;
    description: string;
    status?: PaymentStatus,
    payerEmail?: string;
    payerName?: string;
    payerPhone?: string;
}

