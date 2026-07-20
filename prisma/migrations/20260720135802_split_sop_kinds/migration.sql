-- CreateEnum
CREATE TYPE "SopKind" AS ENUM ('UNIVERSITY', 'VISA');

-- DropForeignKey
ALTER TABLE "SopRecord" DROP CONSTRAINT "SopRecord_studyOptionId_fkey";

-- AlterTable
ALTER TABLE "SopRecord" ADD COLUMN     "documentLabel" TEXT,
ADD COLUMN     "kind" "SopKind" NOT NULL DEFAULT 'UNIVERSITY',
ADD COLUMN     "visaCaseId" TEXT,
ALTER COLUMN "studyOptionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SopRecord" ADD CONSTRAINT "SopRecord_studyOptionId_fkey" FOREIGN KEY ("studyOptionId") REFERENCES "StudyOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SopRecord" ADD CONSTRAINT "SopRecord_visaCaseId_fkey" FOREIGN KEY ("visaCaseId") REFERENCES "VisaCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
