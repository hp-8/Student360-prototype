"use server";

import { requireUser } from "@/lib/auth/session";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/domain/notifications";
import { revalidatePath } from "next/cache";

export async function markNotificationReadAction(notificationId: string) {
  const session = await requireUser();
  await markNotificationRead(notificationId, session.id);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  const session = await requireUser();
  await markAllNotificationsRead(session.id);
  revalidatePath("/", "layout");
}
