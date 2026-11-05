import { prisma } from "../../lib/prisma";

/** Ensure a group with this name exists for the owner; return it */
export async function upsertGroup(
  ownerId: string,
  name: string,
  description?: string | null
) {
  const existing = await prisma.group.findFirst({ where: { ownerId, name } });
  if (existing) return existing;
  return prisma.group.create({
    data: { ownerId, name, description: description ?? null },
  });
}

/** Add a user as a member of the group (idempotent) */
export async function upsertGroupMember(groupId: string, memberUserId: string) {
  const existing = await prisma.groupMember.findFirst({
    where: { groupId, memberId: memberUserId },
  });
  if (existing) return existing;
  return prisma.groupMember.create({
    data: { groupId, memberId: memberUserId, approved: true },
  });
}

/** Ensure group per relationship label, and add target user (if provided) */
export async function upsertRelationshipGroupAndMember(
  ownerId: string,
  label: string,
  memberUserId?: string
) {
  const group = await upsertGroup(ownerId, label);
  if (memberUserId) {
    await upsertGroupMember(group.id, memberUserId);
  }
  return group;
}

/* ------------ Exports used by routes ------------ */

export async function createGroup(
  ownerId: string,
  opts: { name: string; description?: string | null }
) {
  return upsertGroup(ownerId, opts.name, opts.description ?? null);
}

export async function listGroupsOwned(ownerId: string) {
  return prisma.group.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function addMember(
  ownerId: string,
  groupId: string,
  memberUserId: string
) {
  // verify ownership
  const group = await prisma.group.findFirst({ where: { id: groupId, ownerId } });
  if (!group) throw new Error("Group not found");
  return prisma.groupMember.create({
    data: { groupId, memberId: memberUserId, approved: false },
  });
}

export async function approveMember(
  ownerId: string,
  groupId: string,
  memberUserId: string
) {
  const group = await prisma.group.findFirst({ where: { id: groupId, ownerId } });
  if (!group) throw new Error("Group not found");
  return prisma.groupMember.updateMany({
    where: { groupId, memberId: memberUserId },
    data: { approved: true },
  });
}

export async function removeMember(
  ownerId: string,
  groupId: string,
  memberUserId: string
) {
  const group = await prisma.group.findFirst({ where: { id: groupId, ownerId } });
  if (!group) throw new Error("Group not found");
  await prisma.groupMember.deleteMany({ where: { groupId, memberId: memberUserId } });
  return { ok: true as const };
}

export async function listGroupMembers(ownerId: string, groupId: string) {
  const group = await prisma.group.findFirst({ where: { id: groupId, ownerId } });
  if (!group) throw new Error("Group not found");
  return prisma.groupMember.findMany({
    where: { groupId },
    include: { member: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}
