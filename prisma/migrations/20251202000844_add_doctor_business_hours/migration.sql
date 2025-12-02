/*
  Warnings:

  - A unique constraint covering the columns `[doctorId]` on the table `business_hours` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `doctorId` to the `business_hours` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."business_hours" ADD COLUMN     "doctorId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "business_hours_doctorId_key" ON "public"."business_hours"("doctorId");

-- AddForeignKey
ALTER TABLE "public"."business_hours" ADD CONSTRAINT "business_hours_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
