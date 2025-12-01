-- AlterTable
ALTER TABLE "public"."appointments" ADD COLUMN     "doctorId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
