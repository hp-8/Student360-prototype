import { prisma } from "@/lib/prisma";

export async function reassignCaseManager(
  studentId: string,
  newStaffId: string,
  byUserId: string,
  note?: string
) {
  return prisma.$transaction(async (tx) => {
    const student = await tx.student.findUniqueOrThrow({
      where: { id: studentId },
    });

    const previousManagerId = student.currentCaseManagerId;

    await tx.caseAssignment.updateMany({
      where: { studentId, endedAt: null },
      data: { endedAt: new Date() },
    });

    await tx.caseAssignment.create({
      data: {
        studentId,
        staffId: newStaffId,
        assignedById: byUserId,
        note: note ?? "Case manager reassigned.",
      },
    });

    await tx.student.update({
      where: { id: studentId },
      data: { currentCaseManagerId: newStaffId },
    });

    const [previous, next] = await Promise.all([
      previousManagerId
        ? tx.user.findUnique({ where: { id: previousManagerId } })
        : null,
      tx.user.findUniqueOrThrow({ where: { id: newStaffId } }),
    ]);

    await tx.note.create({
      data: {
        studentId,
        authorId: byUserId,
        category: "CASE_MANAGER_REASSIGNMENT",
        body: `Case manager changed from ${previous?.name ?? "unassigned"} to ${next.name}.${
          note ? ` Reason: ${note}` : ""
        }`,
      },
    });

    return tx.student.findUniqueOrThrow({ where: { id: studentId } });
  });
}
