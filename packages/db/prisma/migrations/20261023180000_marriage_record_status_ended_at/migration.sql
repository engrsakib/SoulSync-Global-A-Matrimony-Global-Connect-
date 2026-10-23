-- AlterTable
ALTER TABLE "marriage_records" ADD COLUMN "statusEndedAt" DATE;

-- AlterTable
ALTER TABLE "marriage_record_archives" ADD COLUMN "statusEndedAt" DATE;

-- Backfill ended marriages where end date was not captured
UPDATE "marriage_records"
SET "statusEndedAt" = ("updatedAt" AT TIME ZONE 'UTC')::date
WHERE "status" IN ('DIVORCED', 'DECEASED') AND "statusEndedAt" IS NULL;

UPDATE "marriage_record_archives"
SET "statusEndedAt" = ("updatedAt" AT TIME ZONE 'UTC')::date
WHERE "endedStatus" IN ('DIVORCED', 'DECEASED') AND "statusEndedAt" IS NULL;
