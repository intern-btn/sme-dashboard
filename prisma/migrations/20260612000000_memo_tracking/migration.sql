-- Tracking sirkulasi memo (pipeline PIC → Kadept → Sekretaris → Kadiv → PIC → Arsip)
ALTER TABLE "Memo" ADD COLUMN "trackingStep" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Memo" ADD COLUMN "stepHistory" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Memo" ADD COLUMN "slaHours" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "Memo" ADD COLUMN "trackingRoles" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "Memo" ADD COLUMN "trackingStartedAt" DATETIME;
ALTER TABLE "Memo" ADD COLUMN "trackingCompletedAt" DATETIME;
