import { prisma } from "@/lib/prisma";
import type { SopKind, SopStatus } from "@prisma/client";
import { logActivity } from "@/lib/domain/audit";

// University and Visa statements share this model and status lifecycle, but
// belong to different parents: a University SOP is scoped to the StudyOption
// it's admissions material for, a Visa statement to the VisaCase (country)
// it argues non-immigrant intent for. Exactly one parent id is expected,
// matching kind - the caller (a role-scoped server action) already knows
// which one it has.
export async function createSopRecord(
  data:
    | {
        kind: "UNIVERSITY";
        studyOptionId: string;
        assignedToId?: string | null;
        content?: string | null;
      }
    | {
        kind: "VISA";
        visaCaseId: string;
        documentLabel?: string | null;
        assignedToId?: string | null;
        content?: string | null;
      },
  studentId: string,
  byUserId: string
) {
  return prisma.$transaction(async (tx) => {
    const sop = await tx.sopRecord.create({ data });
    await logActivity(tx, {
      studentId,
      actorId: byUserId,
      action:
        data.kind === "UNIVERSITY"
          ? "Started a university SOP"
          : `Started a visa statement${"documentLabel" in data && data.documentLabel ? ` (${data.documentLabel})` : ""}`,
      entityType: "SopRecord",
      entityId: sop.id,
    });
    return sop;
  });
}

export async function updateSopStatus(
  sopId: string,
  status: SopStatus,
  studentId: string,
  byUserId: string
) {
  return prisma.$transaction(async (tx) => {
    const sop = await tx.sopRecord.update({ where: { id: sopId }, data: { status } });
    await logActivity(tx, {
      studentId,
      actorId: byUserId,
      action: `Changed ${sop.kind === "UNIVERSITY" ? "university SOP" : "visa statement"} status to ${status.replaceAll("_", " ").toLowerCase()}`,
      entityType: "SopRecord",
      entityId: sop.id,
    });
    return sop;
  });
}

export type { SopKind };
