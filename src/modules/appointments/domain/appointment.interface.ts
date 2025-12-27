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

export interface CreateAppointmentDTO {
    userId: string;
    date: Date | string; 
    startTime: string;
    endTime: string;
    type: ConsultationType;
    patientName: string;
    patientEmail?: string;
    patientPhone?: string;
    notes?: string;
    doctorId?: string | null;
    amount?: number;
    description?: string;
}

export interface UpdateAppointmentStatusDTO {
    id: string;
    status: AppointmentStatus;
}