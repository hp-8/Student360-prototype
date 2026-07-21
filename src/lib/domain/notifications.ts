import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Db = PrismaClient | Prisma.TransactionClient;

// Fires an in-app notification for one specific user. Silently skips when
// the action was self-directed (you don't need to be told you did your own
// thing) - callers just pass whoever triggered the event as `actorId`.
export async function notifyUser(
  db: Db,
  params: {
    userId: string;
    actorId: string;
    title: string;
    body?: string;
    href?: string;
  }
) {
  if (params.userId === params.actorId) return;
  await db.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      body: params.body,
      href: params.href,
    },
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
