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
  const fatherName = String(formData.get("fatherName") ?? "").trim() || null;
  const motherName = String(formData.get("motherName") ?? "").trim() || null;
  const schoolName = String(formData.get("schoolName") ?? "").trim();
  const percentageReceivedRaw = String(formData.get("percentageReceived") ?? "").trim();
  const universityAttended = String(formData.get("universityAttended") ?? "").trim() || null;
  const intendedCountryId = String(formData.get("intendedCountryId") ?? "") || null;
  const ieltsAttempted = formData.get("ieltsAttempted") === "true";
  const ieltsScore = ieltsAttempted
    ? String(formData.get("ieltsScore") ?? "").trim() || null
    : null;
  const additionalNotes = String(formData.get("additionalNotes") ?? "").trim() || null;
  const confirmed = formData.get("confirmed") === "true";

  const values = {
    firstName,
    lastName,
    phone,
    email: email ?? "",
    source: source ?? "",
    branchId,
    fatherName: fatherName ?? "",
    motherName: motherName ?? "",
    schoolName,
    percentageReceived: percentageReceivedRaw,
    universityAttended: universityAttended ?? "",
    intendedCountryId: intendedCountryId ?? "",
    ieltsAttempted: String(ieltsAttempted),
    ieltsScore: ieltsScore ?? "",
    additionalNotes: additionalNotes ?? "",
  };

  const percentageReceived = Number(percentageReceivedRaw);

  if (
    !firstName ||
    !lastName ||
    !phone ||
    !branchId ||
    !schoolName ||
    !percentageReceivedRaw ||
    Number.isNaN(percentageReceived)
  ) {
    return {
      error:
        "First name, last name, phone, branch, school name and % received are all required.",
      values,
    };
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

  const lead = await createLead(
    {
      firstName,
      lastName,
      phone,
      email,
      source,
      branchId,
      fatherName,
      motherName,
      schoolName,
      percentageReceived,
      universityAttended,
      intendedCountryId,
      ieltsAttempted,
      ieltsScore,
      additionalNotes,
    },
    session.id
  );

  // Straight to this lead's own page - not the list - so converting it (or
  // marking it lost) is the very next thing staff see, not a second lookup.
  redirect(`/front-desk/leads/${lead.id}`);
}
