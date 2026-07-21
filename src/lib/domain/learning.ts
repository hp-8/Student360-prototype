import { prisma } from "@/lib/prisma";
import type { LearningServiceType, LearningEnrollmentStatus, TestType } from "@prisma/client";
import { logActivity } from "@/lib/domain/audit";
import { humanize } from "@/lib/statusColors";

// One enrollment record per student+service - re-enrolling or updating
// status just updates the existing row rather than piling up duplicates.
export async function upsertEnrollment(
  data: {
    studentId: string;
    service: LearningServiceType;
    status: LearningEnrollmentStatus;
    notes?: string | null;
  },
  byUserId: string
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.learningEnrollment.findFirst({
      where: { studentId: data.studentId, service: data.service },
    });

    const fields = {
      status: data.status,
      notes: data.notes ?? null,
      enrolledAt: data.status !== "NOT_ENROLLED" ? (existing?.enrolledAt ?? new Date()) : null,
      completedAt: data.status === "COMPLETED" ? new Date() : null,
    };

    const enrollment = existing
      ? await tx.learningEnrollment.update({ where: { id: existing.id }, data: fields })
      : await tx.learningEnrollment.create({ data: { studentId: data.studentId, service: data.service, ...fields } });

    await logActivity(tx, {
      studentId: data.studentId,
      actorId: byUserId,
      action: `${humanize(data.service)}: ${humanize(data.status).toLowerCase()}`,
      entityType: "LearningEnrollment",
      entityId: enrollment.id,
    });

    return enrollment;
  });
}

export async function recordTestAttempt(
  data: {
    studentId: string;
    testType: TestType;
    score: string;
    testDate: Date;
    notes?: string | null;
  },
  byUserId: string
) {
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.testAttempt.create({ data });
    await logActivity(tx, {
      studentId: data.studentId,
      actorId: byUserId,
      action: `Logged ${humanize(data.testType)} attempt: ${data.score}`,
      entityType: "TestAttempt",
      entityId: attempt.id,
    });
    return attempt;
  });
}
