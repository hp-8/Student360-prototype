"use server";

import { requireRole } from "@/lib/auth/session";
import { assignWorkItem, updateWorkItemStatus, createWorkItem } from "@/lib/domain/workItems";
import type { WorkItemDepartment, WorkItemPriority, WorkItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function assignWorkItemAction(formData: FormData) {
  await requireRole("COUNSELLOR", "MANAGER");
  const workItemId = String(formData.get("workItemId"));
  const assignedToId = String(formData.get("assignedToId"));
  await assignWorkItem(workItemId, assignedToId);
  revalidatePath("/work-items");
  revalidatePath("/manager/workload");
}

export async function updateWorkItemStatusAction(formData: FormData) {
  await requireRole("COUNSELLOR", "APPLICATIONS_TEAM", "VISA_TEAM", "MANAGER");
  const workItemId = String(formData.get("workItemId"));
  const status = String(formData.get("status")) as WorkItemStatus;
  await updateWorkItemStatus(workItemId, status);
  revalidatePath("/work-items");
  revalidatePath("/manager/workload");
}

export async function createWorkItemAction(formData: FormData) {
  const session = await requireRole("COUNSELLOR", "MANAGER");
  const studentId = String(formData.get("studentId"));
  const title = String(formData.get("title")).trim();
  const department = String(formData.get("department")) as WorkItemDepartment;
  const priority = String(formData.get("priority") ?? "MEDIUM") as WorkItemPriority;
  const assignedToId = String(formData.get("assignedToId") ?? "") || null;
  const dueDateRaw = String(formData.get("dueDate") ?? "");

  await createWorkItem({
    studentId,
    title,
    department,
    priority,
    assignedToId,
    dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
    createdById: session.id,
  });
  revalidatePath("/work-items");
  revalidatePath("/manager/workload");
}
