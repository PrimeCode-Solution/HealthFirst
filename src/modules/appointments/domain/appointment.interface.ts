export type ConsultationType = "GENERAL" | "URGENT" | "FOLLOWUP"
export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"

export interface Appointment {
  id: string;
  userId: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: ConsultationType;
  status: AppointmentStatus;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  notes?: string;
}

export interface CreateAppointmentDTO{
    userId: string;
    date: Date;
    startTime: string;
    endTime: string;
    type: ConsultationType;
    patientName: string;
    patientEmail?: string;
    patientPhone?: string;
    notes?: string;
}

export interface UpdateAppointmentStatusDTO{
    id: string;
    status: AppointmentStatus;
}

export interface AppointmentRepository{
    findById(id: string): Promise<Appointment | null>;
    findByUser(userId: string): Promise<Appointment[]>;
    create(data: CreateAppointmentDTO): Promise<Appointment>;
    update(data: UpdateAppointmentStatusDTO): Promise<Appointment>;
    delete(id: string): Promise<Appointment>;
}






