import { prisma } from "@/lib/prisma";

// Deletes every student/lead/case record while leaving staff logins, branches,
// countries, visa routes, requirement templates, and intakes untouched - so
// the app stays usable immediately after, just with an empty caseload.
// Deletion order matches the FK dependency graph in schema.prisma (children
// before parents); Student sits at the bottom since almost everything hangs
// off it.
export async function clearMockCaseData() {
  return prisma.$transaction(async (tx) => {
    await tx.documentLink.deleteMany({});
    await tx.visaEvent.deleteMany({});
    await tx.caseChecklistItem.deleteMany({});
    await tx.sopRecord.deleteMany({});
    await tx.workItem.deleteMany({});
    await tx.visaAttempt.deleteMany({});
    await tx.visaCase.deleteMany({});
    await tx.offer.deleteMany({});
    await tx.applicationRecord.deleteMany({});
    await tx.studyOption.deleteMany({});
    await tx.document.deleteMany({});
    await tx.countryConfirmation.deleteMany({});
    await tx.caseAssignment.deleteMany({});
    await tx.note.deleteMany({});
    await tx.learningEnrollment.deleteMany({});
    await tx.testAttempt.deleteMany({});
    await tx.auditLog.deleteMany({});
    await tx.notification.deleteMany({});
    await tx.lead.deleteMany({});
    const students = await tx.student.deleteMany({});
    return { studentsDeleted: students.count };
  });
}
