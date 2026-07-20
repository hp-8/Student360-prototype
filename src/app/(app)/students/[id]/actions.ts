"use server";

import { requireRole } from "@/lib/auth/session";
import { createStudyOption } from "@/lib/domain/studyOptions";
import { confirmCountry } from "@/lib/domain/countryConfirmation";
import { reassignCaseManager } from "@/lib/domain/caseManager";
import { addNote } from "@/lib/domain/notes";
import { addDocument, verifyDocument } from "@/lib/domain/documents";
import type { DocumentType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createStudyOptionAction(formData: FormData) {
  const session = await requireRole("COUNSELLOR", "MANAGER");
  const studentId = String(formData.get("studentId"));
  await createStudyOption(
    {
      studentId,
      countryId: String(formData.get("countryId")),
      universityName: String(formData.get("universityName")).trim(),
      courseName: String(formData.get("courseName")).trim(),
      intake: String(formData.get("intake")).trim(),
      intakeId: String(formData.get("intakeId") ?? "") || null,
      assignedCounsellorId: session.role === "COUNSELLOR" ? session.id : String(formData.get("assignedCounsellorId") || "") || null,
      assignedAppsUserId: String(formData.get("assignedAppsUserId") || "") || null,
    },
    session.id
  );
  revalidatePath(`/students/${studentId}`);
}

export async function confirmCountryAction(formData: FormData) {
  const session = await requireRole("COUNSELLOR", "MANAGER");
  const studentId = String(formData.get("studentId"));
  const countryId = String(formData.get("countryId"));
  const note = String(formData.get("note") ?? "").trim() || undefined;
  await confirmCountry(studentId, countryId, session.id, note);
  revalidatePath(`/students/${studentId}`);
}

export async function reassignCaseManagerAction(formData: FormData) {
  const session = await requireRole("MANAGER");
  const studentId = String(formData.get("studentId"));
  const newStaffId = String(formData.get("newStaffId"));
  const note = String(formData.get("note") ?? "").trim() || undefined;
  await reassignCaseManager(studentId, newStaffId, session.id, note);
  revalidatePath(`/students/${studentId}`);
}

export async function addNoteAction(formData: FormData) {
  const session = await requireRole(
    "COUNSELLOR",
    "APPLICATIONS_TEAM",
    "VISA_TEAM",
    "MANAGER"
  );
  const studentId = String(formData.get("studentId"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await addNote(studentId, session.id, body, "GENERAL");
  revalidatePath(`/students/${studentId}`);
}

export async function addDocumentAction(formData: FormData) {
  const session = await requireRole(
    "COUNSELLOR",
    "APPLICATIONS_TEAM",
    "VISA_TEAM",
    "MANAGER"
  );
  const studentId = String(formData.get("studentId"));
  const type = String(formData.get("type")) as DocumentType;
  const label = String(formData.get("label")).trim();
  const expiryDateRaw = String(formData.get("expiryDate") ?? "");
  await addDocument({
    studentId,
    type,
    label,
    expiryDate: expiryDateRaw ? new Date(expiryDateRaw) : null,
    uploadedById: session.id,
  });
  revalidatePath(`/students/${studentId}`);
}

export async function verifyDocumentAction(formData: FormData) {
  const session = await requireRole(
    "COUNSELLOR",
    "APPLICATIONS_TEAM",
    "VISA_TEAM",
    "MANAGER"
  );
  const studentId = String(formData.get("studentId"));
  const documentId = String(formData.get("documentId"));
  await verifyDocument(documentId, session.id);
  revalidatePath(`/students/${studentId}`);
}
