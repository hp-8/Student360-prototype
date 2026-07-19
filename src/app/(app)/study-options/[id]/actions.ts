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
import { prisma } from "@/lib/prisma";
import type { OfferStatus, StudyOptionStatus, ApplicationStatus, SopStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createApplicationAction(formData: FormData) {
  await requireRole("APPLICATIONS_TEAM", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  await createApplication({
    studyOptionId,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function updateApplicationStatusAction(formData: FormData) {
  await requireRole("APPLICATIONS_TEAM", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const applicationId = String(formData.get("applicationId"));
  const status = String(formData.get("status")) as ApplicationStatus;
  await updateApplicationStatus(applicationId, status);
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function recordOfferAction(formData: FormData) {
  await requireRole("APPLICATIONS_TEAM", "COUNSELLOR", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const studentId = String(formData.get("studentId"));
  const countryId = String(formData.get("countryId"));
  const applicationId = String(formData.get("applicationId"));
  const universityName = String(formData.get("universityName")).trim();
  const courseName = String(formData.get("courseName")).trim();
  const intake = String(formData.get("intake")).trim();
  const status = String(formData.get("status")) as OfferStatus;
  const conditions = String(formData.get("conditions") ?? "").trim() || null;

  await recordOffer({
    studentId,
    countryId,
    applicationId,
    universityName,
    courseName,
    intake,
    status,
    conditions,
  });
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function updateOfferStatusAction(formData: FormData) {
  await requireRole("APPLICATIONS_TEAM", "COUNSELLOR", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const offerId = String(formData.get("offerId"));
  const status = String(formData.get("status")) as OfferStatus;
  await updateOfferStatus(offerId, status);
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function createSopRecordAction(formData: FormData) {
  const session = await requireRole("APPLICATIONS_TEAM", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  await createSopRecord({
    studyOptionId,
    assignedToId: session.role === "APPLICATIONS_TEAM" ? session.id : null,
    content: String(formData.get("content") ?? "").trim() || null,
  });
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function updateSopStatusAction(formData: FormData) {
  await requireRole("APPLICATIONS_TEAM", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const sopId = String(formData.get("sopId"));
  const status = String(formData.get("status")) as SopStatus;
  await prisma.sopRecord.update({ where: { id: sopId }, data: { status } });
  revalidatePath(`/study-options/${studyOptionId}`);
}

export async function updateStudyOptionStatusAction(formData: FormData) {
  await requireRole("COUNSELLOR", "MANAGER");
  const studyOptionId = String(formData.get("studyOptionId"));
  const status = String(formData.get("status")) as StudyOptionStatus;
  await updateStudyOptionStatus(studyOptionId, status);
  revalidatePath(`/study-options/${studyOptionId}`);
}
