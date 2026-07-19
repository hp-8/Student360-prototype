import { prisma } from "@/lib/prisma";
import type { DocumentType } from "@prisma/client";
import { logActivity } from "@/lib/domain/audit";

export async function addDocument(data: {
  studentId: string;
  type: DocumentType;
  label: string;
  fileUrl?: string | null;
  expiryDate?: Date | null;
  uploadedById: string;
  linkTo?: { studyOptionId?: string; visaCaseId?: string; workItemId?: string };
}) {
  return prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        studentId: data.studentId,
        type: data.type,
        label: data.label,
        fileUrl: data.fileUrl,
        expiryDate: data.expiryDate,
        uploadedById: data.uploadedById,
      },
    });

    if (data.linkTo) {
      await tx.documentLink.create({
        data: { documentId: document.id, ...data.linkTo },
      });
    }

    await logActivity(tx, {
      studentId: data.studentId,
      actorId: data.uploadedById,
      action: `Uploaded document: ${data.label}`,
      entityType: "Document",
      entityId: document.id,
    });

    return document;
  });
}

export async function verifyDocument(documentId: string, verifiedById: string) {
  return prisma.$transaction(async (tx) => {
    const document = await tx.document.update({
      where: { id: documentId },
      data: { verified: true, verifiedById, verifiedAt: new Date() },
    });
    await logActivity(tx, {
      studentId: document.studentId,
      actorId: verifiedById,
      action: `Verified document: ${document.label}`,
      entityType: "Document",
      entityId: document.id,
    });
    return document;
  });
}
