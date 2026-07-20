"use server";

import { requireRole } from "@/lib/auth/session";
import {
  updateVisaAttempt,
  reopenAttempt,
  closeVisaCase,
  changeActiveOffer,
  updateChecklistItemStatus,
  addOfferSpecificChecklistItem,
} from "@/lib/domain/visaCases";
import { createSopRecord, updateSopStatus } from "@/lib/domain/sop";
import type { VisaAttemptStatus, VisaEventType, ChecklistItemStatus, SopStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateAttemptAction(formData: FormData) {
  const session = await requireRole("VISA_TEAM", "MANAGER");
  const visaCaseId = String(formData.get("visaCaseId"));
  const attemptId = String(formData.get("attemptId"));
  const newStatus = String(formData.get("newStatus")) as VisaAttemptStatus;
  const eventType = String(formData.get("eventType")) as VisaEventType;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await updateVisaAttempt({ attemptId, newStatus, eventType, notes, byUserId: session.id });
  revalidatePath(`/visa/${visaCaseId}`);
}

export async function reopenAttemptAction(formData: FormData) {
  const session = await requireRole("VISA_TEAM", "MANAGER");
  const visaCaseId = String(formData.get("visaCaseId"));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  await reopenAttempt(visaCaseId, session.id, notes);
  revalidatePath(`/visa/${visaCaseId}`);
}

export async function closeVisaCaseAction(formData: FormData) {
  const session = await requireRole("VISA_TEAM", "MANAGER");
  const visaCaseId = String(formData.get("visaCaseId"));
  const reason = String(formData.get("reason")) as "PIVOTED" | "PLAN_ENDED";
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const pivotToStudyOptionId = String(formData.get("pivotToStudyOptionId") ?? "") || null;

  await closeVisaCase({ visaCaseId, reason, byUserId: session.id, notes, pivotToStudyOptionId });
  revalidatePath(`/visa/${visaCaseId}`);
}

export async function changeActiveOfferAction(formData: FormData) {
  const session = await requireRole("VISA_TEAM", "MANAGER");
  const visaCaseId = String(formData.get("visaCaseId"));
  const newOfferId = String(formData.get("newOfferId"));
  await changeActiveOffer(visaCaseId, newOfferId, session.id);
  revalidatePath(`/visa/${visaCaseId}`);
}

export async function updateChecklistItemAction(formData: FormData) {
  const visaCaseId = String(formData.get("visaCaseId"));
  await requireRole("VISA_TEAM", "MANAGER");
  const itemId = String(formData.get("itemId"));
  const status = String(formData.get("status")) as ChecklistItemStatus;
  await updateChecklistItemStatus(itemId, status);
  revalidatePath(`/visa/${visaCaseId}`);
}

export async function addChecklistItemAction(formData: FormData) {
  await requireRole("VISA_TEAM", "MANAGER");
  const visaCaseId = String(formData.get("visaCaseId"));
  const title = String(formData.get("title")).trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  await addOfferSpecificChecklistItem({ visaCaseId, title, description });
  revalidatePath(`/visa/${visaCaseId}`);
}

export async function createVisaStatementAction(formData: FormData) {
  const session = await requireRole("VISA_TEAM", "MANAGER");
  const visaCaseId = String(formData.get("visaCaseId"));
  const studentId = String(formData.get("studentId"));
  await createSopRecord(
    {
      kind: "VISA",
      visaCaseId,
      documentLabel: String(formData.get("documentLabel") ?? "").trim() || null,
      assignedToId: session.role === "VISA_TEAM" ? session.id : null,
      content: String(formData.get("content") ?? "").trim() || null,
    },
    studentId,
    session.id
  );
  revalidatePath(`/visa/${visaCaseId}`);
}

export async function updateVisaStatementStatusAction(formData: FormData) {
  const session = await requireRole("VISA_TEAM", "MANAGER");
  const visaCaseId = String(formData.get("visaCaseId"));
  const studentId = String(formData.get("studentId"));
  const sopId = String(formData.get("sopId"));
  const status = String(formData.get("status")) as SopStatus;
  await updateSopStatus(sopId, status, studentId, session.id);
  revalidatePath(`/visa/${visaCaseId}`);
}
