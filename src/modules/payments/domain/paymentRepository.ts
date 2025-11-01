import{
    CreatePaymentDTO,
    Payment,
} from "./payment.interface";

export interface PaymentRepository{
    create(data: CreatePaymentDTO): Promise<Payment>;
    findById(id: Payment["id"]): Promise<Payment | null>;
    findAll(): Promise<Payment[]>;
    findByAppointmentId(appointmentId: string): Promise<Payment[]>;
    findBySubscriptionId(subscriptionId: string): Promise<Payment[]>;
    findByMercadoPagoId(mercadoPagoId: string): Promise<Payment | null>;
    update(id: Payment["id"],data: Partial<CreatePaymentDTO>,): Promise<Payment>;
    delete(id: Payment["id"]): Promise<void>;
}