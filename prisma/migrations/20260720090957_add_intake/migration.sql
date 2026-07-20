-- AlterTable
ALTER TABLE "StudyOption" ADD COLUMN     "intakeId" TEXT;

-- CreateTable
CREATE TABLE "Intake" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applicationDeadline" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Intake_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Intake_countryId_name_key" ON "Intake"("countryId", "name");

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyOption" ADD CONSTRAINT "StudyOption_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "Intake"("id") ON DELETE SET NULL ON UPDATE CASCADE;
