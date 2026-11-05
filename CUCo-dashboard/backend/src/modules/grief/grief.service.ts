import { prisma } from "../../lib/prisma";
import type { Placement as DBPlacement, TopicStatus as DBStatus } from "@prisma/client";

/** Shape returned to routes (DB enums; routes will map to FE) */
export type UserTopicRow = {
  id: string;                  // UserTopic.id (row id)
  topicId: string | null;      // GriefTopic.id (catalog id, null for custom)
  placement: DBPlacement;      // BASE | MIDDLE | SUMMIT
  status: DBStatus;            // TEXT | CHECK | TEAR | IMAGE
  shared: boolean;
  topic: { title: string } | null;    // joined for FE title (null for custom)
  customTitle: string | null;  // custom title if user-created
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const userTopicInclude = {
  topic: { select: { title: true } },
} as const;

export const griefService = {
  /** List existing user topics (NO implicit creation) */
  async list(userId: string): Promise<UserTopicRow[]> {
    const rows = await prisma.userTopic.findMany({
      where: { userId },
      include: userTopicInclude,
      orderBy: [{ placement: "asc" }, { createdAt: "desc" }],
    });
    return rows;
  },

  /** Create (add catalog topic to the user's mountain). */
  async create(
    userId: string,
    args: {
      topicId: string;
      placement: DBPlacement;
      status: DBStatus;
      shared: boolean;
      description?: string | null;
    }
  ): Promise<UserTopicRow> {
    const { topicId, placement, status, shared, description = null } = args;

    // Upsert guarantees 1 row per (user, topic). If it exists, we just return it unchanged.
    const row = await prisma.userTopic.upsert({
      where: { userId_topicId: { userId, topicId } },
      update: {}, // no change if it already exists
      create: { userId, topicId, placement, status, shared, description },
      include: userTopicInclude,
    });

    return row;
  },

  /** Update only placement by row id, with ownership check. */
  async updatePlacement(
    userId: string,
    id: string,
    placement: DBPlacement
  ): Promise<UserTopicRow> {
    // Ensure ownership
    const existing = await prisma.userTopic.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    const updated = await prisma.userTopic.update({
      where: { id },
      data: { placement },
      include: userTopicInclude,
    });

    return updated;
  },

  async updateShared(userId: string, id: string, shared: boolean): Promise<UserTopicRow> {
    const existing = await prisma.userTopic.findFirst({ where: { id, userId } });
    if (!existing) throw new Error("NOT_FOUND");
    return prisma.userTopic.update({
      where: { id },
      data: { shared },
      include: userTopicInclude,
    });
  },

  /** Remove by row id, with ownership check. */
  async remove(userId: string, id: string): Promise<void> {
    const existing = await prisma.userTopic.findFirst({ where: { id, userId } });
    if (!existing) throw new Error("NOT_FOUND");

    await prisma.userTopic.delete({ where: { id } });
  },

  /** Remove by catalog topicId using the composite unique key (userId, topicId). */
  async removeByTopicId(userId: string, topicId: string): Promise<void> {
    const existing = await prisma.userTopic.findUnique({
      where: { userId_topicId: { userId, topicId } },
      select: { id: true },
    });
    if (!existing) return;

    await prisma.userTopic.delete({
      where: { userId_topicId: { userId, topicId } },
    });
  },

  /** Update status only */
  async updateStatus(
    userId: string,
    idOrTopicId: { id?: string; topicId?: string },
    status: DBStatus
  ): Promise<UserTopicRow> {
    const where =
      idOrTopicId.id
        ? { id: idOrTopicId.id, userId }
        : { userId_topicId: { userId, topicId: idOrTopicId.topicId! } as const };

    const existing = idOrTopicId.id
      ? await prisma.userTopic.findFirst({ where: where as any })
      : await prisma.userTopic.findUnique({ where: where as any });

    if (!existing) throw new Error("NOT_FOUND");

    const updated = await prisma.userTopic.update({
      where: idOrTopicId.id
        ? { id: idOrTopicId.id! }
        : { userId_topicId: { userId, topicId: idOrTopicId.topicId! } },
      data: { status },
      include: userTopicInclude,
    });

    return updated;
  },

  async listSharedForUser(userId: string): Promise<UserTopicRow[]> {
    return prisma.userTopic.findMany({
      where: { userId, shared: true },
      include: userTopicInclude, // includes topic title
      orderBy: [{ placement: "asc" }, { topicId: "asc" }],
    });
  },

  async updateDescription(
    userId: string,
    id: string,
    description: string | null
  ): Promise<UserTopicRow> {
    const existing = await prisma.userTopic.findFirst({ where: { id, userId } });
    if (!existing) throw new Error("NOT_FOUND");

    const updated = await prisma.userTopic.update({
      where: { id },
      data: { description },
      include: userTopicInclude,
    });

    return updated;
  },

  /** Create a custom (user-defined) topic */
  async createCustom(
    userId: string,
    args: {
      customTitle: string;
      placement: DBPlacement;
      status: DBStatus;
      shared?: boolean;
      description?: string | null;
    }
  ): Promise<UserTopicRow> {
    const { customTitle, placement, status, shared = false, description = null } = args;

    const row = await prisma.userTopic.create({
      data: {
        userId,
        customTitle,
        topicId: null,
        placement,
        status,
        shared,
        description,
      },
      include: userTopicInclude,
    });

    return row;
  }
};
