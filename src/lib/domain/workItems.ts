import { prisma } from "@/lib/prisma";
import type {
  WorkItemDepartment,
  WorkItemPriority,
  WorkItemStatus,
} from "@prisma/client";
import { logActivity } from "@/lib/domain/audit";
import { notifyUser } from "@/lib/domain/notifications";
import { humanize } from "@/lib/statusColors";

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
  return prisma.$transaction(async (tx) => {
    const item = await tx.workItem.create({ data });
    await logActivity(tx, {
      studentId: data.studentId,
      actorId: data.createdById,
      action: `Created work item: ${data.title}`,
      entityType: "WorkItem",
      entityId: item.id,
    });
    if (data.assignedToId) {
      await notifyUser(tx, {
        userId: data.assignedToId,
        actorId: data.createdById,
        title: `New work item: ${data.title}`,
        href: `/work-items?studentId=${data.studentId}`,
      });
    }
    return item;
  });
}

export async function assignWorkItem(
  workItemId: string,
  assignedToId: string,
  byUserId: string
) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.workItem.update({
      where: { id: workItemId },
      data: { assignedToId },
    });
    const assignee = await tx.user.findUniqueOrThrow({ where: { id: assignedToId } });
    await logActivity(tx, {
      studentId: item.studentId,
      actorId: byUserId,
      action: `Assigned work item "${item.title}" to ${assignee.name}`,
      entityType: "WorkItem",
      entityId: item.id,
    });
    await notifyUser(tx, {
      userId: assignedToId,
      actorId: byUserId,
      title: `You were assigned a work item: ${item.title}`,
      href: `/work-items?studentId=${item.studentId}`,
    });
    return item;
  });
}

export async function updateWorkItemStatus(
  workItemId: string,
  status: WorkItemStatus,
  byUserId: string
) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.workItem.update({ where: { id: workItemId }, data: { status } });
    await logActivity(tx, {
      studentId: item.studentId,
      actorId: byUserId,
      action: `Changed work item "${item.title}" status to ${humanize(status)}`,
      entityType: "WorkItem",
      entityId: item.id,
    });
    return item;
  });
}
