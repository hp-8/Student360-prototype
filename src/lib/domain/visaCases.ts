import { prisma } from "@/lib/prisma";
import type { VisaAttemptStatus, VisaEventType } from "@prisma/client";
import { releaseCountryConfirmation } from "./countryConfirmation";
import { logActivity } from "@/lib/domain/audit";
import { humanize } from "@/lib/statusColors";

type ChecklistTemplateItem = {
  title: string;
  description?: string;
  required?: boolean;
};

export async function openVisaCase(params: {
  studentId: string;
  countryId: string;
  visaRouteId: string;
  activeOfferId?: string | null;
  assignedToId?: string | null;
  byUserId: string;
  notes?: string | null;
}) {
  const template = await prisma.requirementTemplate.findFirst({
    where: { visaRouteId: params.visaRouteId, isActive: true },
    orderBy: { version: "desc" },
  });
  if (!template) {
    throw new Error(
      "No active requirement template found for this visa route. Ask an Administrator to configure one."
    );
  }

  return prisma.$transaction(async (tx) => {
    const visaCase = await tx.visaCase.create({
      data: {
        studentId: params.studentId,
        countryId: params.countryId,
        visaRouteId: params.visaRouteId,
        requirementTemplateId: template.id,
        activeOfferId: params.activeOfferId ?? null,
        assignedToId: params.assignedToId ?? null,
        openedById: params.byUserId,
        notes: params.notes ?? null,
      },
    });

    const items = template.items as unknown as ChecklistTemplateItem[];
    if (items.length > 0) {
      await tx.caseChecklistItem.createMany({
        data: items.map((item) => ({
          visaCaseId: visaCase.id,
          source: "BASE" as const,
          title: item.title,
          description: item.description ?? null,
          required: item.required ?? true,
        })),
      });
    }

    const attempt = await tx.visaAttempt.create({
      data: {
        visaCaseId: visaCase.id,
        attemptNumber: 1,
        status: "DOCUMENTS_PENDING",
      },
    });

    await tx.visaEvent.create({
      data: {
        visaAttemptId: attempt.id,
        type: "NOTE",
        notes: "Visa case opened.",
        createdById: params.byUserId,
      },
    });

    await logActivity(tx, {
      studentId: params.studentId,
      actorId: params.byUserId,
      action: "Opened a visa case",
      entityType: "VisaCase",
      entityId: visaCase.id,
    });

    return visaCase;
  });
}

export async function addOfferSpecificChecklistItem(data: {
  visaCaseId: string;
  title: string;
  description?: string | null;
  required?: boolean;
  addedForOfferId?: string | null;
}) {
  return prisma.caseChecklistItem.create({
    data: {
      visaCaseId: data.visaCaseId,
      source: "OFFER_SPECIFIC",
      title: data.title,
      description: data.description ?? null,
      required: data.required ?? true,
      addedForOfferId: data.addedForOfferId ?? null,
    },
  });
}

export async function updateChecklistItemStatus(
  itemId: string,
  status: "PENDING" | "RECEIVED" | "VERIFIED" | "WAIVED"
) {
  return prisma.caseChecklistItem.update({
    where: { id: itemId },
    data: { status },
  });
}

export async function changeActiveOffer(
  visaCaseId: string,
  newOfferId: string,
  byUserId: string
) {
  return prisma.$transaction(async (tx) => {
    const visaCase = await tx.visaCase.update({
      where: { id: visaCaseId },
      data: { activeOfferId: newOfferId },
    });
    const offer = await tx.offer.findUniqueOrThrow({
      where: { id: newOfferId },
    });
    await tx.note.create({
      data: {
        studentId: visaCase.studentId,
        authorId: byUserId,
        category: "GENERAL",
        body: `Active offer for the visa case switched to ${offer.universityName}.`,
      },
    });
    await logActivity(tx, {
      studentId: visaCase.studentId,
      actorId: byUserId,
      action: `Switched the active offer to ${offer.universityName}`,
      entityType: "VisaCase",
      entityId: visaCaseId,
    });
    return visaCase;
  });
}

export async function updateVisaAttempt(params: {
  attemptId: string;
  newStatus: VisaAttemptStatus;
  eventType: VisaEventType;
  notes?: string | null;
  byUserId: string;
  eventDate?: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const decided = ["APPROVED", "REFUSED", "WITHDRAWN"].includes(
      params.newStatus
    );

    const attempt = await tx.visaAttempt.update({
      where: { id: params.attemptId },
      data: {
        status: params.newStatus,
        decidedAt: decided ? new Date() : undefined,
      },
      include: { visaCase: { select: { studentId: true } } },
    });

    await tx.visaEvent.create({
      data: {
        visaAttemptId: params.attemptId,
        type: params.eventType,
        notes: params.notes ?? null,
        createdById: params.byUserId,
        eventDate: params.eventDate ?? new Date(),
      },
    });

    await logActivity(tx, {
      studentId: attempt.visaCase.studentId,
      actorId: params.byUserId,
      action: `Visa attempt status changed to ${humanize(params.newStatus)}`,
      entityType: "VisaAttempt",
      entityId: attempt.id,
    });

    return attempt;
  });
}

export async function reopenAttempt(
  visaCaseId: string,
  byUserId: string,
  notes?: string | null
) {
  return prisma.$transaction(async (tx) => {
    const lastAttempt = await tx.visaAttempt.findFirst({
      where: { visaCaseId },
      orderBy: { attemptNumber: "desc" },
    });
    if (!lastAttempt || lastAttempt.status !== "REFUSED") {
      throw new Error(
        "A new attempt can only be opened after the previous attempt was refused."
      );
    }

    const attempt = await tx.visaAttempt.create({
      data: {
        visaCaseId,
        attemptNumber: lastAttempt.attemptNumber + 1,
        status: "DOCUMENTS_PENDING",
      },
    });

    await tx.visaEvent.create({
      data: {
        visaAttemptId: attempt.id,
        type: "NOTE",
        notes: notes ?? `Reapplying after refusal on attempt ${lastAttempt.attemptNumber}.`,
        createdById: byUserId,
      },
    });

    const visaCase = await tx.visaCase.update({
      where: { id: visaCaseId },
      data: { lifecycleStatus: "OPEN" },
    });

    await logActivity(tx, {
      studentId: visaCase.studentId,
      actorId: byUserId,
      action: `Reopened the case with attempt #${attempt.attemptNumber} after refusal`,
      entityType: "VisaAttempt",
      entityId: attempt.id,
    });

    return attempt;
  });
}

export async function closeVisaCase(params: {
  visaCaseId: string;
  reason: "PIVOTED" | "PLAN_ENDED";
  byUserId: string;
  notes?: string | null;
  pivotToStudyOptionId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const visaCase = await tx.visaCase.update({
      where: { id: params.visaCaseId },
      data: {
        lifecycleStatus: "CLOSED",
        closeReason: params.reason,
        closedAt: new Date(),
      },
    });

    await releaseCountryConfirmation(visaCase.studentId, visaCase.countryId, params.byUserId, tx);

    if (params.reason === "PIVOTED" && params.pivotToStudyOptionId) {
      await tx.studyOption.update({
        where: { id: params.pivotToStudyOptionId },
        data: { status: "ACTIVE" },
      });
    }

    await tx.note.create({
      data: {
        studentId: visaCase.studentId,
        authorId: params.byUserId,
        category: "VISA_CASE_STATUS_CHANGE",
        body:
          params.reason === "PIVOTED"
            ? `Visa case closed. Student is pivoting to a different study option.${
                params.notes ? ` ${params.notes}` : ""
              }`
            : `Visa case closed. Student is ending this plan.${
                params.notes ? ` ${params.notes}` : ""
              }`,
      },
    });

    await logActivity(tx, {
      studentId: visaCase.studentId,
      actorId: params.byUserId,
      action:
        params.reason === "PIVOTED"
          ? "Closed the visa case to pivot to a different study option"
          : "Closed the visa case (plan ended)",
      entityType: "VisaCase",
      entityId: visaCase.id,
    });

    return visaCase;
  });
}
