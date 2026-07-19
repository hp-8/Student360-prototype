import type { Role } from "@prisma/client";
import { ROLE_LABEL } from "@/lib/roles";

/** "Chirag Bhatt - Counsellor" (joins multiple roles with " / "). */
export function staffName(user: { name: string; roles: Role[] }) {
  const roleLabel = user.roles.length
    ? user.roles.map((r) => ROLE_LABEL[r]).join(" / ")
    : "No role";
  return `${user.name} - ${roleLabel}`;
}

/** "Priya Desai - Student" */
export function studentName(student: { firstName: string; lastName: string }) {
  return `${student.firstName} ${student.lastName} - Student`;
}

/** "Aarav Kapoor - Enquiry" (for leads not yet converted to a student). */
export function leadName(lead: { firstName: string; lastName: string }) {
  return `${lead.firstName} ${lead.lastName} - Enquiry`;
}
