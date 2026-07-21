"use server";

import { requireRole } from "@/lib/auth/session";
import {
  createApplication,
  recordOffer,
  updateOfferStatus,
  updateApplicationStatus,
  updateStudyOptionStatus,
  updateStudyOption,
  deleteStudyOption,
  reassignStudyOptionAppsUser,
} from "@/lib/domain/studyOptions";
import { createSopRecord, updateSopStatus } from "@/lib/domain/sop";
import { logActivity } from "@/lib/domain/audit";
import { prisma } from "@/lib/prisma";
import type { OfferStatus, StudyOptionStatus, ApplicationStatus, SopStatus } from "@prisma/client";
import { humanize } from "@/lib/statusColors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  await updateOfferStatus(offerId, status, session.id);
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
  await createSopRecord(
    {
      kind: "UNIVERSITY",
      studyOptionId,
      assignedToId: session.role === "APPLICATIONS_TEAM" ? session.id : null,
      content: String(formData.get("content") ?? "").trim() || null,
    },
    studentId,
    session.id
  );
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function updateSopStatusAction(formData: FormData) {
  const session = await requireRole("APPLICATIONS_TEAM", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const studentId = String(formData.get("studentId"));
  const sopId = String(formData.get("sopId"));
  const status = String(formData.get("status")) as SopStatus;
  await updateSopStatus(sopId, status, studentId, session.id);
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function updateStudyOptionAction(formData: FormData) {
  const session = await requireRole("COUNSELLOR", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  await updateStudyOption(
    studyOptionId,
    {
      countryId: String(formData.get("countryId")),
      universityName: String(formData.get("universityName")),
      courseName: String(formData.get("courseName")),
      intake: String(formData.get("intake")),
      intakeId: String(formData.get("intakeId") ?? "") || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
    session.id
  );
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function reassignStudyOptionAppsUserAction(formData: FormData) {
  const session = await requireRole("COUNSELLOR", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const newAppsUserId = String(formData.get("newAppsUserId"));
  await reassignStudyOptionAppsUser(studyOptionId, newAppsUserId, session.id);
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function deleteStudyOptionAction(formData: FormData) {
  const session = await requireRole("COUNSELLOR", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const studentId = String(formData.get("studentId"));
  await deleteStudyOption(studyOptionId, session.id);
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
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
