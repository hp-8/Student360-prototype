import { prisma } from "@/lib/prisma";
import type { ApplicationStatus, OfferStatus, StudyOptionStatus } from "@prisma/client";
import { logActivity } from "@/lib/domain/audit";

export async function createStudyOption(
  data: {
    studentId: string;
    countryId: string;
    universityName: string;
    courseName: string;
    intake: string;
    intakeId?: string | null;
    assignedCounsellorId?: string | null;
    assignedAppsUserId?: string | null;
    notes?: string | null;
  },
  byUserId: string
) {
  return prisma.$transaction(async (tx) => {
    const option = await tx.studyOption.create({ data });
    await logActivity(tx, {
      studentId: data.studentId,
      actorId: byUserId,
      action: `Added study option: ${data.universityName} (${data.courseName})`,
      entityType: "StudyOption",
      entityId: option.id,
    });
    return option;
  });
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

export async function recordOffer(
  data: {
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
  },
  byUserId: string
) {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.offer.create({ data });
    if (data.applicationId) {
      await tx.applicationRecord.update({
        where: { id: data.applicationId },
        data: { status: "DECIDED" },
      });
    }
    await logActivity(tx, {
      studentId: data.studentId,
      actorId: byUserId,
      action: `Recorded offer from ${data.universityName}${data.isExternal ? " (external)" : ""}`,
      entityType: "Offer",
      entityId: offer.id,
    });
    return offer;
  });
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
