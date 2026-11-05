import { prisma } from "../../lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * List people who share their data with `currentUserId` (the viewer).
 * - Requires a direct connection with status ACCEPTED
 * - Adds `expiresAt` (from inviteExpiresAt) so the frontend can show a chip
 */
export async function listViewersForUser(currentUserId: string) {
  const rows = await prisma.connection.findMany({
    where: {
      targetUserId: currentUserId,
      status: "ACCEPTED",
    },
    include: {
      owner: { select: { id: true, name: true, username: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    acceptedAt: r.updatedAt.toISOString(),
    label: r.label ?? null,
    // prefer expiresAt, fall back to inviteExpiresAt if that's the legacy field
    expiresAt:
      r.expiresAt
        ? r.expiresAt.toISOString()
        : r.inviteExpiresAt
        ? r.inviteExpiresAt.toISOString()
        : null,
    accessLevel: r.accessLevel ?? null,
    fromUser: {
      id: r.owner.id,
      name: r.owner.name ?? r.owner.username ?? "Unknown",
      username: r.owner.username ?? null,
      email: r.owner.email ?? null,
    },
  }));
}


/**
 * Topics shared by a given owner with the viewer (me).
 * Logic mirrors your proven implementation:
 * - Verify direct connection exists, is ACCEPTED, and not expired (inviteExpiresAt)
 * - Return ONLY the owner's shared userTopics, ordered and with topic title
 * - (Access-level filters are left as TODOs—same as before)
 */
export async function getSharedTopicsFromOwner(ownerId: string, viewerId: string) {
  const conn = await prisma.connection.findFirst({
    where: {
      ownerId,
      targetUserId: viewerId,
      status: "ACCEPTED",
    },
    select: {
      id: true,
      accessLevel: true,
      expiresAt: true,
      inviteExpiresAt: true,
    },
  });

  // No connection or expired: no access
  if (!conn) return [];
  const now = new Date();
  if (conn.expiresAt && conn.expiresAt < now) return [];
  if (conn.inviteExpiresAt && conn.inviteExpiresAt < now) return [];

  // Base filter: owner's topics that are marked shared
  let where: Prisma.UserTopicWhereInput = {
    userId: ownerId,
    shared: true,
  };

  // Access-level enforcement
  switch (conn.accessLevel) {
    case "FULL":
      // keep base filter (all shared items)
      break;

    case "NONE":
      return [];

    case "POSITIVE_ONLY":
      // TODO: when you have a “positive” attribute to filter on
      break;

    case "NEGATIVE_ONLY":
      // TODO: when you have a “negative” attribute to filter on
      break;

    case "CUSTOM":
      // TODO: when you add a per-connection permission table
      // Example:
      // const allowed = await prisma.viewerPermission.findMany({
      //   where: { connectionId: conn.id, allowed: true },
      //   select: { topicId: true },
      // });
      // where = { ...where, topicId: { in: allowed.map(a => a.topicId) } };
      break;

    default:
      // Unknown value: safest is no data
      return [];
  }

  const rows = await prisma.userTopic.findMany({
    where,
    include: { topic: { select: { title: true } } }, // title lives on GriefTopic
    orderBy: [{ placement: "asc" }, { topicId: "asc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    topicId: r.topicId,
    title: r.topic?.title ?? "(untitled)",
    placement: String(r.placement).toLowerCase() as "base" | "middle" | "summit",
    status: String(r.status).toLowerCase(),
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    description: r.description ?? null,
    
  }));
}
