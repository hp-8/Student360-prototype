import { prisma } from "@/lib/prisma";
import type {
  WorkItemDepartment,
  WorkItemPriority,
  WorkItemStatus,
} from "@prisma/client";

export async function createWorkItem(data: {
  title: string;
  department: WorkItemDepartment;
  studentId: string;
  studyOptionId?: string | null;
  visaCaseId?: string | null;
  assignedToId?: string | null;
  dueDate?: Date | null;
  priority?: WorkItemPriority;
  createdById: string;
}) {
  return prisma.workItem.create({ data });
}

export async function assignWorkItem(workItemId: string, assignedToId: string) {
  return prisma.workItem.update({
    where: { id: workItemId },
    data: { assignedToId },
  });
}

export async function updateWorkItemStatus(
  workItemId: string,
  status: WorkItemStatus
) {
  return prisma.workItem.update({ where: { id: workItemId }, data: { status } });
}
