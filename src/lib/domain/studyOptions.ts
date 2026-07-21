import { prisma } from "@/lib/prisma";
import type { ApplicationStatus, OfferStatus, StudyOptionStatus } from "@prisma/client";
import { logActivity } from "@/lib/domain/audit";
import { notifyUser } from "@/lib/domain/notifications";

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
  const universityName = data.universityName.trim();
  const courseName = data.courseName.trim();
  const intake = data.intake.trim();

  if (!universityName) throw new Error("University name is required.");
  if (!courseName) throw new Error("Course name is required.");
  if (!intake) throw new Error("Intake is required.");
  if (!data.countryId) throw new Error("Country is required.");

  return prisma.$transaction(async (tx) => {
    const duplicate = await tx.studyOption.findFirst({
      where: { studentId: data.studentId, countryId: data.countryId, universityName, courseName },
    });
    if (duplicate) {
      throw new Error(`This student already has a study option for ${universityName} (${courseName}).`);
    }

    const option = await tx.studyOption.create({
      data: { ...data, universityName, courseName, intake },
    });
    await logActivity(tx, {
      studentId: data.studentId,
      actorId: byUserId,
      action: `Added study option: ${universityName} (${courseName})`,
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

export async function reassignStudyOptionAppsUser(
  studyOptionId: string,
  newAppsUserId: string,
  byUserId: string
) {
  return prisma.$transaction(async (tx) => {
    const option = await tx.studyOption.update({
      where: { id: studyOptionId },
      data: { assignedAppsUserId: newAppsUserId },
    });
    const assignee = await tx.user.findUniqueOrThrow({ where: { id: newAppsUserId } });
    await logActivity(tx, {
      studentId: option.studentId,
      actorId: byUserId,
      action: `Assigned ${assignee.name} to handle applications for ${option.universityName}`,
      entityType: "StudyOption",
      entityId: studyOptionId,
    });
    await notifyUser(tx, {
      userId: newAppsUserId,
      actorId: byUserId,
      title: `You were assigned to handle applications for ${option.universityName}`,
      href: `/study-options/${studyOptionId}`,
    });
    return option;
  });
}

export async function updateStudyOption(
  studyOptionId: string,
  data: {
    countryId: string;
    universityName: string;
    courseName: string;
    intake: string;
    intakeId?: string | null;
    notes?: string | null;
  },
  byUserId: string
) {
  const universityName = data.universityName.trim();
  const courseName = data.courseName.trim();
  const intake = data.intake.trim();

  if (!universityName) throw new Error("University name is required.");
  if (!courseName) throw new Error("Course name is required.");
  if (!intake) throw new Error("Intake is required.");
  if (!data.countryId) throw new Error("Country is required.");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.studyOption.findUniqueOrThrow({ where: { id: studyOptionId } });

    const duplicate = await tx.studyOption.findFirst({
      where: {
        id: { not: studyOptionId },
        studentId: existing.studentId,
        countryId: data.countryId,
        universityName,
        courseName,
      },
    });
    if (duplicate) {
      throw new Error(`This student already has a study option for ${universityName} (${courseName}).`);
    }

    const updated = await tx.studyOption.update({
      where: { id: studyOptionId },
      data: {
        countryId: data.countryId,
        universityName,
        courseName,
        intake,
        intakeId: data.intakeId,
        notes: data.notes,
      },
    });
    await logActivity(tx, {
      studentId: updated.studentId,
      actorId: byUserId,
      action: `Edited study option: ${universityName} (${courseName})`,
      entityType: "StudyOption",
      entityId: studyOptionId,
    });
    return updated;
  });
}

export async function deleteStudyOption(studyOptionId: string, byUserId: string) {
  return prisma.$transaction(async (tx) => {
    const option = await tx.studyOption.findUniqueOrThrow({
      where: { id: studyOptionId },
      include: { applications: true, sopRecords: true, workItems: true },
    });

    if (option.applications.length > 0 || option.sopRecords.length > 0 || option.workItems.length > 0) {
      throw new Error(
        "This study option already has applications, an SOP, or work items on file — use the \"Withdrawn\" status instead of deleting."
      );
    }

    await tx.documentLink.deleteMany({ where: { studyOptionId } });
    await tx.studyOption.delete({ where: { id: studyOptionId } });

    await logActivity(tx, {
      studentId: option.studentId,
      actorId: byUserId,
      action: `Deleted study option: ${option.universityName} (${option.courseName})`,
      entityType: "StudyOption",
      entityId: studyOptionId,
    });
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

export async function updateOfferStatus(offerId: string, status: OfferStatus, byUserId: string) {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.offer.update({ where: { id: offerId }, data: { status } });

    if ((status === "ACCEPTED" || status === "REJECTED") && offer.applicationId) {
      const application = await tx.applicationRecord.findUnique({
        where: { id: offer.applicationId },
        select: { studyOptionId: true },
      });
      const studyOption = application
        ? await tx.studyOption.findUnique({
            where: { id: application.studyOptionId },
            select: { assignedCounsellorId: true, assignedAppsUserId: true },
          })
        : null;

      if (studyOption && application) {
        const title = `Offer ${status === "ACCEPTED" ? "accepted" : "rejected"}: ${offer.universityName}`;
        const href = `/study-options/${application.studyOptionId}`;
        const recipients = new Set([studyOption.assignedCounsellorId, studyOption.assignedAppsUserId].filter(Boolean));
        for (const recipient of recipients) {
          if (recipient) {
            await notifyUser(tx, { userId: recipient, actorId: byUserId, title, href });
          }
        }
      }
    }

    return offer;
  });
}

