"use server";

import { requireRole } from "@/lib/auth/session";
import {
  createApplication,
  recordOffer,
  updateOfferStatus,
  updateApplicationStatus,
  createSopRecord,
  updateStudyOptionStatus,
} from "@/lib/domain/studyOptions";
import { logActivity } from "@/lib/domain/audit";
import { prisma } from "@/lib/prisma";
import type { OfferStatus, StudyOptionStatus, ApplicationStatus, SopStatus } from "@prisma/client";
import { humanize } from "@/lib/statusColors";
import { revalidatePath } from "next/cache";

export async function createApplicationAction(formData: FormData) {
  const session = await requireRole("APPLICATIONS_TEAM", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const studentId = String(formData.get("studentId"));
  await createApplication({
    studyOptionId,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  await logActivity(prisma, {
    studentId,
    actorId: session.id,
    action: "Logged a new application",
    entityType: "ApplicationRecord",
    entityId: studyOptionId,
  });
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function updateApplicationStatusAction(formData: FormData) {
  const session = await requireRole("APPLICATIONS_TEAM", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const studentId = String(formData.get("studentId"));
  const applicationId = String(formData.get("applicationId"));
  const status = String(formData.get("status")) as ApplicationStatus;
  await updateApplicationStatus(applicationId, status);
  await logActivity(prisma, {
    studentId,
    actorId: session.id,
    action: `Changed application status to ${humanize(status)}`,
    entityType: "ApplicationRecord",
    entityId: applicationId,
  });
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function recordOfferAction(formData: FormData) {
  const session = await requireRole("APPLICATIONS_TEAM", "COUNSELLOR", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const studentId = String(formData.get("studentId"));
  const countryId = String(formData.get("countryId"));
  const applicationId = String(formData.get("applicationId"));
  const universityName = String(formData.get("universityName")).trim();
  const courseName = String(formData.get("courseName")).trim();
  const intake = String(formData.get("intake")).trim();
  const status = String(formData.get("status")) as OfferStatus;
  const conditions = String(formData.get("conditions") ?? "").trim() || null;

  await recordOffer(
    {
      studentId,
      countryId,
      applicationId,
      universityName,
      courseName,
      intake,
      status,
      conditions,
    },
    session.id
  );
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function updateOfferStatusAction(formData: FormData) {
  const session = await requireRole("APPLICATIONS_TEAM", "COUNSELLOR", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const studentId = String(formData.get("studentId"));
  const offerId = String(formData.get("offerId"));
  const status = String(formData.get("status")) as OfferStatus;
  await updateOfferStatus(offerId, status);
  await logActivity(prisma, {
    studentId,
    actorId: session.id,
    action: `Changed offer status to ${humanize(status)}`,
    entityType: "Offer",
    entityId: offerId,
  });
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function createSopRecordAction(formData: FormData) {
  const session = await requireRole("APPLICATIONS_TEAM", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const studentId = String(formData.get("studentId"));
  const sop = await createSopRecord({
    studyOptionId,
    assignedToId: session.role === "APPLICATIONS_TEAM" ? session.id : null,
    content: String(formData.get("content") ?? "").trim() || null,
  });
  await logActivity(prisma, {
    studentId,
    actorId: session.id,
    action: "Started an SOP record",
    entityType: "SopRecord",
    entityId: sop.id,
  });
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function updateSopStatusAction(formData: FormData) {
  const session = await requireRole("APPLICATIONS_TEAM", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const studentId = String(formData.get("studentId"));
  const sopId = String(formData.get("sopId"));
  const status = String(formData.get("status")) as SopStatus;
  await prisma.sopRecord.update({ where: { id: sopId }, data: { status } });
  await logActivity(prisma, {
    studentId,
    actorId: session.id,
    action: `Changed SOP status to ${humanize(status)}`,
    entityType: "SopRecord",
    entityId: sopId,
  });
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function updateStudyOptionStatusAction(formData: FormData) {
  const session = await requireRole("COUNSELLOR", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const studentId = String(formData.get("studentId"));
  const status = String(formData.get("status")) as StudyOptionStatus;
  await updateStudyOptionStatus(studyOptionId, status);
  await logActivity(prisma, {
    studentId,
    actorId: session.id,
    action: `Changed study option status to ${humanize(status)}`,
    entityType: "StudyOption",
    entityId: studyOptionId,
  });
  revalidatePath(`/study-options/${studyOptionId}`);
}
