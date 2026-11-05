import { prisma } from "../../lib/prisma"; // adjust your import path as needed

export async function canUserViewUserTopic(viewerId: string, userTopicId: string) {
  const now = new Date();

  // 1) Owner can always view
  const ut = await prisma.userTopic.findUnique({
    where: { id: userTopicId },
    select: { userId: true },
  });
  if (!ut) return false;
  if (ut.userId === viewerId) return true;

  // 2) Direct active share
  const direct = await prisma.topicShare.findFirst({
    where: {
      userTopicId,
      sharedWithId: viewerId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { id: true },
  });
  if (direct) return true;

  // 3) Group active share (viewer is approved member)
  const group = await prisma.topicShare.findFirst({
    where: {
      userTopicId,
      group: {
        members: {
          some: { memberId: viewerId, approved: true },
        },
      },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { id: true },
  });

  return !!group;
}

export async function listTopicsVisibleTo(viewerId: string) {
  const now = new Date();

  // Direct shares
  const direct = await prisma.topicShare.findMany({
    where: {
      sharedWithId: viewerId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { userTopicId: true },
  });

  // Group shares
  const viaGroups = await prisma.topicShare.findMany({
    where: {
      group: { members: { some: { memberId: viewerId, approved: true } } },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { userTopicId: true },
  });

  const ids = Array.from(new Set([...direct, ...viaGroups].map(x => x.userTopicId)));

  if (ids.length === 0) return [];

  return prisma.userTopic.findMany({
    where: { id: { in: ids } },
    include: {
      topic: true,
      user: { select: { id: true, name: true, username: true } }, // owner info
    },
  });
}
