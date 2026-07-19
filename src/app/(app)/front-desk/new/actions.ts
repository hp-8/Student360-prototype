"use server";

import { requireRole } from "@/lib/auth/session";
import { createLead, findDuplicateLeads, findDuplicateStudents } from "@/lib/domain/leads";
import { redirect } from "next/navigation";

export type NewEnquiryState = {
  error?: string;
  duplicates?: {
    students: { id: string; name: string; phone: string; email: string | null }[];
    leads: { id: string; name: string; phone: string; email: string | null }[];
  };
  values?: Record<string, string>;
};

export async function newEnquiryAction(
  prevState: NewEnquiryState,
  formData: FormData
): Promise<NewEnquiryState> {
  const session = await requireRole("FRONT_DESK", "MANAGER");

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const source = String(formData.get("source") ?? "").trim() || null;
  const branchId = String(formData.get("branchId") ?? "");
  const educationSnapshot =
    String(formData.get("educationSnapshot") ?? "").trim() || null;
  const confirmed = formData.get("confirmed") === "true";

  const values = {
    firstName,
    lastName,
    phone,
    email: email ?? "",
    source: source ?? "",
    branchId,
    educationSnapshot: educationSnapshot ?? "",
  };

  if (!firstName || !lastName || !phone || !branchId) {
    return { error: "First name, last name, phone and branch are required.", values };
  }

  if (!confirmed) {
    const [students, leads] = await Promise.all([
      findDuplicateStudents({ firstName, lastName, phone, email }),
      findDuplicateLeads({ firstName, lastName, phone, email }),
    ]);
    if (students.length > 0 || leads.length > 0) {
      return {
        values,
        duplicates: {
          students: students.map((s) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            phone: s.phone,
            email: s.email,
          })),
          leads: leads.map((l) => ({
            id: l.id,
            name: `${l.firstName} ${l.lastName}`,
            phone: l.phone,
            email: l.email,
          })),
        },
      };
    }
  }

  await createLead(
    { firstName, lastName, phone, email, source, branchId, educationSnapshot },
    session.id
  );

  redirect("/front-desk");
}
