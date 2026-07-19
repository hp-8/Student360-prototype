import { prisma } from "@/lib/prisma";
import type { LearningServiceType, LearningEnrollmentStatus, TestType } from "@prisma/client";

export async function upsertEnrollment(data: {
  studentId: string;
  service: LearningServiceType;
  status: LearningEnrollmentStatus;
  notes?: string | null;
}) {
  return prisma.learningEnrollment.create({
    data: {
      studentId: data.studentId,
      service: data.service,
      status: data.status,
      notes: data.notes,
      enrolledAt: data.status !== "NOT_ENROLLED" ? new Date() : null,
      completedAt: data.status === "COMPLETED" ? new Date() : null,
    },
  });
}

export async function recordTestAttempt(data: {
  studentId: string;
  testType: TestType;
  score: string;
  testDate: Date;
  notes?: string | null;
}) {
  return prisma.testAttempt.create({ data });
}
