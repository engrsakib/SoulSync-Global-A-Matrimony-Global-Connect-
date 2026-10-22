-- CreateEnum
CREATE TYPE "BiodataEditorScope" AS ENUM ('CONTENT', 'SETTINGS', 'BOTH');

-- AlterTable
ALTER TABLE "biodata_editor_grants" ADD COLUMN "scope" "BiodataEditorScope" NOT NULL DEFAULT 'BOTH';
