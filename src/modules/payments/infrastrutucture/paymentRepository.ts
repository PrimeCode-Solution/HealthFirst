import type{
    Payment,
    CreatePaymentDTO,
} from "../domain/payment.interface";
import { PaymentRepository } from "../domain/paymentRepository";
import api from "@/lib/api";

export function createPaymentRepository(): PaymentRepository{
    return{
        create,
        findAll,
        findById,
        findByAppointmentId,
        findBySubscriptionId,
        findByMercadoPagoId,
        update,
        delete: deletePayment,
    };
}

async function create(data:CreatePaymentDTO): Promise<Payment> {
    const response = await api.post<Payment>("/payments");
    return response.data;
}

async function findAll(): Promise<Payment[]> {
    const response = await api.get<Payment[]>("/payments");
    return response.data;
}

async function findById(id: Payment["id"]): Promise<Payment | null>{
    const response = await api.get<Payment>(`/payments/${id}`);
    return response.data;
}

async function findByAppointmentId(
    appointmentId: string
): Promise<Payment[]> {
    const response = await api.get<Payment[]>(
        `/payments?appointmentId=${appointmentId}`
    );
    return response.data;
}

async function findBySubscriptionId(
    subscriptionId: string
): Promise<Payment[]> {
    const response = await api.get<Payment[]>(
    `/payments?subscriptionId=${subscriptionId}`
    );
    return response.data;
}

async function findByMercadoPagoId(
    mercadoPagoId: string
): Promise<Payment | null> {
    const response = await api.get<Payment>(
        `/payments?=mercadoPagoId=${mercadoPagoId}`
    );
    return response.data;
}

async function update(
    id:Payment["id"],
    data: Partial<CreatePaymentDTO>
): Promise<Payment> {
    const response = await api.patch<Payment>(`/payments/${id}`, data);
    return response.data;
}

async function deletePayment(id: Payment["id"]): Promise<void> {
    await api.delete(`/payments/${id}`);
}