import { Appointment, CreateAppointmentDTO, UpdateAppointmentStatusDTO } from "./appointment.interface";

export interface AppointmentRepositoryDomain {
    findAll(): Promise<Appointment[]>;
    findById(id: string): Promise<Appointment>;
    findByUser(userId: string): Promise<Appointment[]>;
    create(data: CreateAppointmentDTO): Promise<Appointment>;
    update(data: UpdateAppointmentStatusDTO): Promise<Appointment>;
    delete(id: string): Promise<Appointment>;
}
