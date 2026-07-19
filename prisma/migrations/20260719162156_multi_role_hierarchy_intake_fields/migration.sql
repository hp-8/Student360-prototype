-- This migration is written to be idempotent: an earlier version of it
-- failed partway against a non-empty database, so every statement here is
-- safe to re-run regardless of exactly how far that attempt got.

-- AlterEnum
ALTER TYPE "OfferStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN IF EXISTS "educationSnapshot",
ADD COLUMN IF NOT EXISTS "additionalNotes" TEXT,
ADD COLUMN IF NOT EXISTS "fatherName" TEXT,
ADD COLUMN IF NOT EXISTS "ieltsAttempted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "ieltsScore" TEXT,
ADD COLUMN IF NOT EXISTS "intendedCountryId" TEXT,
ADD COLUMN IF NOT EXISTS "motherName" TEXT,
ADD COLUMN IF NOT EXISTS "percentageReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "schoolName" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "universityAttended" TEXT;

ALTER TABLE "Lead" ALTER COLUMN "percentageReceived" DROP DEFAULT;
ALTER TABLE "Lead" ALTER COLUMN "schoolName" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN IF EXISTS "educationSnapshot",
ADD COLUMN IF NOT EXISTS "additionalNotes" TEXT,
ADD COLUMN IF NOT EXISTS "fatherName" TEXT,
ADD COLUMN IF NOT EXISTS "ieltsAttempted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "ieltsScore" TEXT,
ADD COLUMN IF NOT EXISTS "intendedCountryId" TEXT,
ADD COLUMN IF NOT EXISTS "motherName" TEXT,
ADD COLUMN IF NOT EXISTS "percentageReceived" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "schoolName" TEXT,
ADD COLUMN IF NOT EXISTS "universityAttended" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "role",
ADD COLUMN IF NOT EXISTS "managerId" TEXT,
ADD COLUMN IF NOT EXISTS "roles" "Role"[] NOT NULL DEFAULT ARRAY[]::"Role"[];

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Lead" ADD CONSTRAINT "Lead_intendedCountryId_fkey" FOREIGN KEY ("intendedCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Student" ADD CONSTRAINT "Student_intendedCountryId_fkey" FOREIGN KEY ("intendedCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
