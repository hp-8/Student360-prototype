import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth/session";

type Db = PrismaClient | Prisma.TransactionClient;

export async function logActivity(
  db: Db,
  params: {
    studentId?: string;
    leadId?: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId?: string;
  }
) {
  await db.auditLog.create({
    data: {
      studentId: params.studentId,
      leadId: params.leadId,
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
    },
  });
}

// Case-access scoping for the activity feed: Manager and Administrator see
// everything, everyone else only sees activity on students they're actually
// working (current case manager, an active case assignment, a study option
// they're the counsellor/apps user on, a visa case assigned to them, a work
// item assigned to them, or the enquiry they originally took).
export async function hasCaseAccess(session: SessionUser, studentId: string): Promise<boolean> {
  if (session.roles.includes("MANAGER") || session.roles.includes("ADMINISTRATOR")) return true;

  const userId = session.id;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      currentCaseManagerId: true,
      caseAssignments: { where: { staffId: userId, endedAt: null }, select: { id: true } },
      studyOptions: {
        where: { OR: [{ assignedCounsellorId: userId }, { assignedAppsUserId: userId }] },
        select: { id: true },
      },
      visaCases: { where: { assignedToId: userId }, select: { id: true } },
      workItems: { where: { assignedToId: userId }, select: { id: true } },
      originatingLead: { select: { createdById: true } },
    },
  });

  if (!student) return false;

  return (
    student.currentCaseManagerId === userId ||
    student.caseAssignments.length > 0 ||
    student.studyOptions.length > 0 ||
    student.visaCases.length > 0 ||
    student.workItems.length > 0 ||
    student.originatingLead?.createdById === userId
  );
}
