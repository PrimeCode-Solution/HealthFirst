import { PrismaClient } from "@prisma/client";
import type { Appointment, CreateAppointmentDTO, UpdateAppointmentStatusDTO, AppointmentRepository} from "../domain/appointment.interface";

const prisma = new PrismaClient()

export class PrismaAppointmentRepository implements AppointmentRepository {
    async findById(id: string): Promise<Appointment | null> {
        const row = await prisma.appointment.findUnique({ where: { id } });
        return row
    }

    async findByUser(userId: string): Promise<Appointment[]> {
        return prisma.appointment.findMany({ where: { userId }, orderBy: { date: "asc" } });
    }

    async create(data: CreateAppointmentDTO): Promise<Appointment> {
        return prisma.appointment.create({ data });
    }

    async update(data: UpdateAppointmentStatusDTO): Promise<Appointment> {
        const { id, ...rest } = data
        return prisma.appointment.update({
            where: { id },
            data: rest as any,
        });
    }

    async delete(id: string): Promise<Appointment> {
        return prisma.appointment.delete({ where: { id } });
    }
}
