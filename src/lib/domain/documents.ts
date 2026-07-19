import { prisma } from "@/lib/prisma";
import type { DocumentType } from "@prisma/client";

export async function addDocument(data: {
  studentId: string;
  type: DocumentType;
  label: string;
  fileUrl?: string | null;
  expiryDate?: Date | null;
  uploadedById: string;
  linkTo?: { studyOptionId?: string; visaCaseId?: string; workItemId?: string };
}) {
  const document = await prisma.document.create({
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
    await prisma.documentLink.create({
      data: { documentId: document.id, ...data.linkTo },
    });
  }

  return document;
}

export async function verifyDocument(documentId: string, verifiedById: string) {
  return prisma.document.update({
    where: { id: documentId },
    data: { verified: true, verifiedById, verifiedAt: new Date() },
  });
}
