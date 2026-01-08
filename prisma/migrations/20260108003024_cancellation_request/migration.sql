-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "public"."AppointmentStatus" ADD VALUE 'CANCELLATION_REQUESTED';

-- CreateTable
CREATE TABLE "public"."cancellation_requests" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "reason" TEXT,
    "adminNotes" TEXT,
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "cancellation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cancellation_requests_appointmentId_key" ON "public"."cancellation_requests"("appointmentId");

-- AddForeignKey
ALTER TABLE "public"."cancellation_requests" ADD CONSTRAINT "cancellation_requests_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
