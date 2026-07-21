"use server";

import { requireRole } from "@/lib/auth/session";
import { convertLeadToStudent, markLeadLost } from "@/lib/domain/leads";
import { redirect } from "next/navigation";

export async function convertAction(formData: FormData) {
  const session = await requireRole("FRONT_DESK", "MANAGER");
  const leadId = String(formData.get("leadId"));
  const consentNotes = String(formData.get("consentNotes") ?? "").trim() || null;

  await convertLeadToStudent(
    leadId,
    { consentNotes },
    null,
    session.id
  );

  redirect(`/front-desk/students`);
}

export async function markLostAction(formData: FormData) {
  const session = await requireRole("FRONT_DESK", "MANAGER");
  const leadId = String(formData.get("leadId"));
  const reason = String(formData.get("reason") ?? "").trim();
  await markLeadLost(leadId, reason || "No reason given.", session.id);
  redirect("/front-desk");
}
