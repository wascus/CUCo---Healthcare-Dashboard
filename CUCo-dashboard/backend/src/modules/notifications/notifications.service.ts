import { prisma } from "../../lib/prisma";

export async function listMyNotifications(userId: string, take = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      actor: { select: { id: true, name: true, username: true } },
      connection: { select: { id: true } },
    },
  });
}

export async function markNotificationRead(userId: string, id: string) {
  const n = await prisma.notification.findUnique({
    where: { id },
    include: { actor: { select: { id: true, name: true, username: true } }, connection: { select: { id: true } } },
  });
  if (!n || n.userId !== userId) return null;

  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
    include: { actor: { select: { id: true, name: true, username: true } }, connection: { select: { id: true } } },
  });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function deleteNotification(userId: string, id: string) {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n || n.userId !== userId) return false;
  await prisma.notification.delete({ where: { id } });
  return true;
}
