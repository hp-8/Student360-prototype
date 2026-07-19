"use server";

import { requireRole } from "@/lib/auth/session";
import { convertLeadToStudent, markLeadLost } from "@/lib/domain/leads";
import { redirect } from "next/navigation";

export async function convertAction(formData: FormData) {
  const session = await requireRole("FRONT_DESK", "MANAGER");
  const leadId = String(formData.get("leadId"));
  const caseManagerId = String(formData.get("caseManagerId"));
  const consentNotes = String(formData.get("consentNotes") ?? "").trim() || null;

  if (!caseManagerId) throw new Error("A case manager must be selected.");

  await convertLeadToStudent(
    leadId,
    { consentNotes },
    caseManagerId,
    session.id
  );

  redirect(`/front-desk/students`);
}

export async function markLostAction(formData: FormData) {
  await requireRole("FRONT_DESK", "MANAGER");
  const leadId = String(formData.get("leadId"));
  const reason = String(formData.get("reason") ?? "").trim();
  await markLeadLost(leadId, reason || "No reason given.");
  redirect("/front-desk");
}
