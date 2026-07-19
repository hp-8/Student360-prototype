import { prisma } from "@/lib/prisma";
import type { ApplicationStatus, OfferStatus, StudyOptionStatus } from "@prisma/client";

export async function createStudyOption(data: {
  studentId: string;
  countryId: string;
  universityName: string;
  courseName: string;
  intake: string;
  assignedCounsellorId?: string | null;
  assignedAppsUserId?: string | null;
  notes?: string | null;
}) {
  return prisma.studyOption.create({ data });
}

export async function updateStudyOptionStatus(
  studyOptionId: string,
  status: StudyOptionStatus
) {
  return prisma.studyOption.update({
    where: { id: studyOptionId },
    data: { status },
  });
}

export async function createApplication(data: {
  studyOptionId: string;
  appliedDate?: Date;
  status?: ApplicationStatus;
  notes?: string | null;
}) {
  return prisma.applicationRecord.create({ data });
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
) {
  return prisma.applicationRecord.update({
    where: { id: applicationId },
    data: { status },
  });
}

export async function recordOffer(data: {
  studentId: string;
  countryId: string;
  applicationId?: string | null;
  universityName: string;
  courseName: string;
  intake: string;
  status?: OfferStatus;
  isExternal?: boolean;
  conditions?: string | null;
  notes?: string | null;
}) {
  const offer = await prisma.offer.create({ data });
  if (data.applicationId) {
    await prisma.applicationRecord.update({
      where: { id: data.applicationId },
      data: { status: "DECIDED" },
    });
  }
  return offer;
}

export async function updateOfferStatus(offerId: string, status: OfferStatus) {
  return prisma.offer.update({ where: { id: offerId }, data: { status } });
}

export async function createSopRecord(data: {
  studyOptionId: string;
  assignedToId?: string | null;
  content?: string | null;
}) {
  return prisma.sopRecord.create({ data });
}
