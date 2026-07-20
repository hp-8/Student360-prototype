import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/domain/audit";

const DEADLINE_WORK_ITEM_PREFIX = "Application deadline";

// Setting (or changing) an intake's universal application deadline cascades
// to every study option already targeting that intake: each gets an
// auto-created (or auto-updated) high-priority work item carrying the new
// due date, so staff don't have to set the same deadline by hand per student.
export async function propagateIntakeDeadline(
  intakeId: string,
  deadline: Date | null,
  byUserId: string
) {
  return prisma.$transaction(async (tx) => {
    const intake = await tx.intake.update({
      where: { id: intakeId },
      data: { applicationDeadline: deadline },
      include: { country: true },
    });

    const studyOptions = await tx.studyOption.findMany({
      where: { intakeId },
      select: { id: true, studentId: true },
    });

    for (const so of studyOptions) {
      const existing = await tx.workItem.findFirst({
        where: { studyOptionId: so.id, title: { startsWith: DEADLINE_WORK_ITEM_PREFIX }, autoCreated: true },
      });

      if (!deadline) {
        if (existing) await tx.workItem.delete({ where: { id: existing.id } });
        continue;
      }

      if (existing) {
        if (existing.dueDate?.getTime() !== deadline.getTime()) {
          await tx.workItem.update({ where: { id: existing.id }, data: { dueDate: deadline } });
          await logActivity(tx, {
            studentId: so.studentId,
            actorId: byUserId,
            action: `Updated application deadline for ${intake.name} (${intake.country.name})`,
            entityType: "WorkItem",
            entityId: existing.id,
          });
        }
      } else {
        const created = await tx.workItem.create({
          data: {
            title: `${DEADLINE_WORK_ITEM_PREFIX} — ${intake.name}`,
            department: "APPLICATIONS",
            studentId: so.studentId,
            studyOptionId: so.id,
            dueDate: deadline,
            priority: "HIGH",
            autoCreated: true,
            createdById: byUserId,
          },
        });
        await logActivity(tx, {
          studentId: so.studentId,
          actorId: byUserId,
          action: `Set application deadline for ${intake.name} (${intake.country.name})`,
          entityType: "WorkItem",
          entityId: created.id,
        });
      }
    }

    return intake;
  });
}
