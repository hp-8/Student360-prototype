import { prisma } from "@/lib/prisma";
import type { NoteCategory } from "@prisma/client";

export async function addNote(
  studentId: string,
  authorId: string,
  body: string,
  category: NoteCategory = "GENERAL"
) {
  return prisma.note.create({ data: { studentId, authorId, body, category } });
}
