/*
  Warnings:

  - You are about to drop the column `educationSnapshot` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `educationSnapshot` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Added the required column `percentageReceived` to the `Lead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolName` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "OfferStatus" ADD VALUE 'ACCEPTED';

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "educationSnapshot",
ADD COLUMN     "additionalNotes" TEXT,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "ieltsAttempted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ieltsScore" TEXT,
ADD COLUMN     "intendedCountryId" TEXT,
ADD COLUMN     "motherName" TEXT,
ADD COLUMN     "percentageReceived" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "schoolName" TEXT NOT NULL,
ADD COLUMN     "universityAttended" TEXT;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "educationSnapshot",
ADD COLUMN     "additionalNotes" TEXT,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "ieltsAttempted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ieltsScore" TEXT,
ADD COLUMN     "intendedCountryId" TEXT,
ADD COLUMN     "motherName" TEXT,
ADD COLUMN     "percentageReceived" DOUBLE PRECISION,
ADD COLUMN     "schoolName" TEXT,
ADD COLUMN     "universityAttended" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "roles" "Role"[];

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_intendedCountryId_fkey" FOREIGN KEY ("intendedCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_intendedCountryId_fkey" FOREIGN KEY ("intendedCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
