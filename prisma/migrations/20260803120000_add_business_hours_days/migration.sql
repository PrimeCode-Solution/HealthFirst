-- CreateTable
CREATE TABLE "public"."business_hours_days" (
    "id" TEXT NOT NULL,
    "businessHoursId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "lunchBreakEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lunchStartTime" TEXT,
    "lunchEndTime" TEXT,
    "appointmentDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_hours_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_hours_days_businessHoursId_idx" ON "public"."business_hours_days"("businessHoursId");

-- CreateIndex
CREATE UNIQUE INDEX "business_hours_days_businessHoursId_dayOfWeek_key" ON "public"."business_hours_days"("businessHoursId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "public"."business_hours_days" ADD CONSTRAINT "business_hours_days_businessHoursId_fkey" FOREIGN KEY ("businessHoursId") REFERENCES "public"."business_hours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: replica a escala global existente para os 7 dias da semana,
-- preservando quais dias estavam habilitados (dayOfWeek segue Date#getDay(): 0 = Domingo).
INSERT INTO "public"."business_hours_days" (
    "id",
    "businessHoursId",
    "dayOfWeek",
    "enabled",
    "startTime",
    "endTime",
    "lunchBreakEnabled",
    "lunchStartTime",
    "lunchEndTime",
    "appointmentDuration",
    "createdAt",
    "updatedAt"
)
SELECT
    md5(bh."id" || '-' || d."dayOfWeek"::text),
    bh."id",
    d."dayOfWeek",
    CASE d."dayOfWeek"
        WHEN 0 THEN bh."sundayEnabled"
        WHEN 1 THEN bh."mondayEnabled"
        WHEN 2 THEN bh."tuesdayEnabled"
        WHEN 3 THEN bh."wednesdayEnabled"
        WHEN 4 THEN bh."thursdayEnabled"
        WHEN 5 THEN bh."fridayEnabled"
        ELSE bh."saturdayEnabled"
    END,
    bh."startTime",
    bh."endTime",
    bh."lunchBreakEnabled",
    bh."lunchStartTime",
    bh."lunchEndTime",
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "public"."business_hours" bh
CROSS JOIN (SELECT generate_series(0, 6) AS "dayOfWeek") d;
