import { prisma } from "../../lib/prisma";

export type UpsertSharesInput = {
  ownerId: string;
  userTopicId: string;
  users?: Array<{ userId: string; permission?: "VIEW"|"COMMENT"|"EDIT"; expiresAt?: Date | null }>;
  groups?: Array<{ groupId: string; permission?: "VIEW"|"COMMENT"|"EDIT"; expiresAt?: Date | null }>;
};

export async function listSharesForTopic(ownerId: string, userTopicId: string) {
  const ut = await prisma.userTopic.findUniqueOrThrow({
    where: { id: userTopicId },
    select: { userId: true },
  });
  if (ut.userId !== ownerId) throw new Error("Forbidden");

  return prisma.topicShare.findMany({
    where: { ownerId, userTopicId },
    include: {
      sharedWith: { select: { id: true, name: true, username: true, email: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function upsertShares(input: UpsertSharesInput) {
  const ut = await prisma.userTopic.findUniqueOrThrow({
    where: { id: input.userTopicId },
    select: { userId: true },
  });
  if (ut.userId !== input.ownerId) {
    throw new Error("Not allowed: you do not own this topic instance.");
  }

  const ops: Promise<unknown>[] = [];

  for (const u of input.users ?? []) {
    const createData = {
      ownerId: input.ownerId,
      userTopicId: input.userTopicId,
      sharedWithId: u.userId,
      permission: (u.permission ?? "VIEW") as any,
      ...(u.expiresAt === undefined ? {} : { expiresAt: u.expiresAt ?? null }),
    };
    const updateData = {
      permission: (u.permission ?? "VIEW") as any,
      ...(u.expiresAt === undefined ? {} : { expiresAt: u.expiresAt ?? null }),
    };

    ops.push(
      prisma.topicShare.upsert({
        where: {
          userTopicId_sharedWithId: {
            userTopicId: input.userTopicId,
            sharedWithId: u.userId,
          },
        },
        create: createData,
        update: updateData,
      })
    );
  }

  for (const g of input.groups ?? []) {
    const group = await prisma.group.findFirst({
      where: { id: g.groupId, ownerId: input.ownerId },
      select: { id: true },
    });
    if (!group) throw new Error("Group not found or not owned by you.");

    const createData = {
      ownerId: input.ownerId,
      userTopicId: input.userTopicId,
      groupId: g.groupId,
      permission: (g.permission ?? "VIEW") as any,
      ...(g.expiresAt === undefined ? {} : { expiresAt: g.expiresAt ?? null }),
    };
    const updateData = {
      permission: (g.permission ?? "VIEW") as any,
      ...(g.expiresAt === undefined ? {} : { expiresAt: g.expiresAt ?? null }),
    };

    ops.push(
      prisma.topicShare.upsert({
        where: {
          userTopicId_groupId: {
            userTopicId: input.userTopicId,
            groupId: g.groupId,
          },
        },
        create: createData,
        update: updateData,
      })
    );
  }

  await Promise.all(ops);
  return listSharesForTopic(input.ownerId, input.userTopicId);
}

export async function revokeShare(ownerId: string, shareId: string) {
  await prisma.topicShare.findFirstOrThrow({
    where: { id: shareId, ownerId },
    select: { id: true },
  });
  await prisma.topicShare.delete({ where: { id: shareId } });
}
