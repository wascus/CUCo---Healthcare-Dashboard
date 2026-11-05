import { prisma } from "../../lib/prisma";
import {
  Prisma,
  RelationshipType,
  AccessLevel as DBAccessLevel,
  ConnectionStatus,
} from "@prisma/client";
import {
  type CreateForUserInput,
  type CreateForContactInput,
  type UpdateConnectionInput,
  type InviteByEmailInput,
} from "./connections.schemas";
import { upsertRelationshipGroupAndMember } from "../groups/groups.service";

/** Relationship → Group label */
export function relationshipToGroupLabel(
  r: RelationshipType
): "supporters" | "acquaintances" | "professionals" {
  if (r === "DOCTOR" || r === "THERAPIST") return "professionals";
  return "supporters";
}
export type HistoryRow = {
  id: string;
  personEmail?: string | null;
  personName?: string | null;
  status: "READ" | "UNREAD";
  payload: "EMAIL" | "ID";
  createdAt: string;
  readAt?: string | null;
};
const connectionSelect = {
  id: true,
  ownerId: true,
  targetUserId: true,
  targetUser: { select: { id: true, username: true, name: true, email: true } },
  contactId: true,
  contact: { select: { id: true, displayName: true, email: true } },
  relationship: true,
  accessLevel: true,
  status: true,
  label: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  expiresAt: true,
} satisfies Prisma.ConnectionSelect;

/** --- helpers --------------------------------------------------- */

/** Remove any direct shares from owner→target user to cut access immediately */
async function cascadeRevokeShares(ownerId: string, targetUserId: string) {
  await prisma.topicShare.deleteMany({
    where: {
      ownerId,
      sharedWithId: targetUserId,
    },
  });
}

/** Create a notification if a recipient exists (typed for Prisma JSON) */
async function notify(opts: {
  toUserId: string;
  actorId?: string | null;
  type: "INVITE_RECEIVED" | "INVITE_RESPONSE";
  connectionId?: string | null;
  payload?: Prisma.InputJsonValue | null;
}) {
  await prisma.notification.create({
    data: {
      userId: opts.toUserId,
      actorId: opts.actorId ?? null,
      type: opts.type,
      connectionId: opts.connectionId ?? null,
      // IMPORTANT: Prisma JSON must be InputJsonValue or Prisma.DbNull (not plain null)
      payload: opts.payload ?? Prisma.DbNull,
    },
  });
}

/** Remove target user from a group based on label */
async function removeFromGroup(ownerId: string, targetUserId: string, label: string) {
  const group = await prisma.group.findFirst({ where: { ownerId, name: label } });
  if (group) {
    await prisma.groupMember.deleteMany({
      where: { groupId: group.id, memberId: targetUserId },
    });
  }
}

/** --------------------------------------------------------------- */

export async function listConnections(ownerId: string) {
  const rows = await prisma.connection.findMany({
    where: { ownerId, status: { in: ["PENDING", "ACCEPTED"] } },
    select: connectionSelect,
    orderBy: { createdAt: "desc" },
  });
  return rows;
}

export async function createConnectionForUser(ownerId: string, body: CreateForUserInput) {
  const label =
    body.label ?? relationshipToGroupLabel(body.relationship as RelationshipType);

  const conn = await prisma.connection.create({
    data: {
      ownerId,
      targetUserId: body.targetUserId,
      relationship: body.relationship as any,
      accessLevel: body.accessLevel as any,
      status: "PENDING",
      label,
      invitedVia: body.invitedVia ?? null,
    },
    select: connectionSelect,
  });

  // group sync
  await upsertRelationshipGroupAndMember(ownerId, label, conn.targetUserId ?? undefined);

    await notify({
      toUserId: conn.targetUserId as string,
      actorId: ownerId,
      type: "INVITE_RECEIVED",
      connectionId: conn.id,
      payload: { 
        connectionId: conn.id, 
        relationship: conn.relationship, 
        label: conn.label ?? null 
      },
    });

  return conn;
}

export async function createConnectionForContact(ownerId: string, body: CreateForContactInput) {
  const label =
    body.label ?? relationshipToGroupLabel(body.relationship as RelationshipType);

  const safeName: string = (body.contact.name ?? "").trim() || "Unnamed";

  const contact = await prisma.contact.create({
    data: {
      ownerId,
      displayName: safeName,
      email: body.contact.email?.trim().toLowerCase() ?? null,
    },
  });

  const conn = await prisma.connection.create({
    data: {
      ownerId,
      contactId: contact.id,
      relationship: body.relationship as any,
      accessLevel: body.accessLevel as any,
      status: "PENDING",
      label,
      invitedVia: body.invitedVia ?? null,
    },
    select: connectionSelect,
  });

  // group sync
  await upsertRelationshipGroupAndMember(ownerId, label);

  return conn;
}

export async function inviteByEmail(ownerId: string, body: InviteByEmailInput) {
  const email = body.email.trim().toLowerCase();
  const label =
    body.label ?? relationshipToGroupLabel(body.relationship as RelationshipType);

  const existingUser = await prisma.user.findFirst({ where: { email } });

  if (existingUser) {
    const conn = await createConnectionForUser(ownerId, {
      ...body,
      targetUserId: existingUser.id,
      invitedVia: "EMAIL",
    });
    return conn;
  }

  // fallback → contact
  const fallbackName = email.split("@")[0] || "Unnamed";
  return createConnectionForContact(ownerId, {
    contact: { name: fallbackName, email },
    relationship: body.relationship,
    accessLevel: body.accessLevel,
    label,
    invitedVia: "EMAIL",
  });
}

export async function updateConnection(ownerId: string, id: string, patch: UpdateConnectionInput) {
  const existing = await prisma.connection.findFirst({ where: { id, ownerId } });
  if (!existing) throw new Error("Not found");

  const nextLabel =
    patch.label !== undefined
      ? patch.label
      : patch.relationship
      ? relationshipToGroupLabel(patch.relationship as RelationshipType)
      : undefined;

  const data: Prisma.ConnectionUpdateInput = {};
  if (patch.relationship !== undefined) data.relationship = patch.relationship as any;
  if (patch.accessLevel !== undefined) data.accessLevel = patch.accessLevel as any;
  if (patch.note !== undefined) data.note = patch.note;
  if (nextLabel !== undefined) data.label = nextLabel;
  if ("expiresAt" in patch) data.expiresAt = patch.expiresAt ? new Date(patch.expiresAt) : null;
  if ("customBase" in patch) data.customBase = patch.customBase ?? null;

  const updated = await prisma.connection.update({
    where: { id },
    data,
    select: connectionSelect,
  });

  // 🚫 Cascade revoke when access becomes NONE
  if (
    patch.accessLevel === "NONE" &&
    updated.targetUserId // only direct user connections
  ) {
    await cascadeRevokeShares(ownerId, updated.targetUserId);
  }

  // keep grouping in sync on relationship or label change
  if (
    updated.targetUserId &&
    (patch.relationship !== undefined || patch.label !== undefined)
  ) {
    if (existing.label && existing.label !== updated.label) {
      await removeFromGroup(ownerId, updated.targetUserId, existing.label);
    }
    if (updated.label) {
      await upsertRelationshipGroupAndMember(ownerId, updated.label, updated.targetUserId);
    }
  }

  return updated;
}

export async function removeConnection(ownerId: string, id: string) {
  const conn = await prisma.connection.findFirst({ where: { id, ownerId } });
  if (!conn) throw new Error("Not found");

  // 🚫 Cascade revoke before delete (only direct user shares)
  if (conn.targetUserId) {
    await cascadeRevokeShares(ownerId, conn.targetUserId);
    if (conn.label) {
      await removeFromGroup(ownerId, conn.targetUserId, conn.label);
    }
  }

  await prisma.connection.delete({ where: { id } });
  return { ok: true as const };
}

export async function respondToInvite(
  meId: string,
  id: string,
  action: "accept" | "decline"
) {
  const c = await prisma.connection.findUnique({
    where: { id },
    select: { id: true, ownerId: true, targetUserId: true },
  });
  if (!c) throw new Error("Not found");
  if (!c.targetUserId) throw new Error("Invite is not for a user");
  if (c.targetUserId !== meId) throw new Error("Forbidden");

  const status: ConnectionStatus = action === "accept" ? "ACCEPTED" : "DECLINED";

  const updated = await prisma.connection.update({
    where: { id },
    data: { status },
    select: connectionSelect,
  });

  // 🔔 notify owner with canonical fields the UI expects
  await notify({
    toUserId: c.ownerId,
    actorId: meId,
    type: "INVITE_RESPONSE",
    connectionId: updated.id,
    payload: {
      action,                        // "accept" | "decline"
      accepted: action === "accept", // boolean
      status,                        // "ACCEPTED" | "DECLINED"
    },
  });

  return updated;
}

export async function renewConnection(
  ownerId: string,
  id: string,
  nextExpiresAt?: string | null
) {
  const conn = await prisma.connection.findFirst({ where: { id, ownerId } });
  if (!conn) throw new Error("Not found");
  if (!conn.targetUserId) throw new Error("Cannot renew a contact-only invite");

  const updated = await prisma.connection.update({
    where: { id },
    data: {
      status: "PENDING",
      ...(nextExpiresAt !== undefined
        ? { expiresAt: nextExpiresAt ? new Date(nextExpiresAt) : null }
        : {}),
    },
    select: {
      id: true,
      ownerId: true,
      targetUserId: true,
      status: true,
      expiresAt: true,
      label: true,
      relationship: true,
    },
  });

  // notify target user
  await notify({
    toUserId: updated.targetUserId!,
    actorId: ownerId,
    type: "INVITE_RECEIVED",
    connectionId: updated.id,
    payload: {
      action: "renew",
      label: updated.label ?? null,
      relationship: updated.relationship,
      expiresAt: updated.expiresAt ?? null,
    },
  });

  return updated;
}
export async function getRequestsHistory(p: { userId: string; page: number; pageSize: number }) {
  const { userId, page, pageSize } = p;
  const skip = Math.max(0, (page - 1) * pageSize);
  const take = Math.min(100, Math.max(1, pageSize));

  // We consider "requests I sent" = notifications authored by me
  // where the recipient is the target (user/contact) of the connection.
  // For invites, the type is INVITE_RECEIVED (recipient receives it).
  const where = {
    actorId: userId,
    type: "INVITE_RECEIVED" as const,
  };

  const [rows, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        user:{
          select:{
            name: true,
            email:true
          }
        },
        connection: {
          select: {
            invitedVia: true,
            targetUser: { select: { email: true, name: true, username: true } },
            contact: { select: { email: true, displayName: true } },
            accessLevel: true,
          },
        },
      },
    }),
    prisma.notification.count({ where }),
  ]);

  const items: HistoryRow[] = rows.map((n) => {
    console.log("row ",n);
    
    const c = n.connection;
    const u = n.user
    const personEmail =
      (n as any).personEmail ??
      c?.contact?.email ??
      c?.targetUser?.email ??
      u?.email
      ??
      null;

    const personName =
      (n as any).personName ??
      c?.contact?.displayName ??
      c?.targetUser?.name ??
      c?.targetUser?.username ??
      u?.name??
      null;

    // Derive payload from how the invite was sent
    const payload =
      (c?.invitedVia?.toLowerCase?.() === "email" ? "EMAIL" : "ID") as "EMAIL" | "ID";

    const status = n.readAt ? "READ" as const : "UNREAD" as const;
    const accessLevel = c?.accessLevel;
    return {
      id: n.id,
      personEmail,
      personName,
      status,
      payload,
      createdAt: n.createdAt.toISOString(),
      readAt: n.readAt ? n.readAt.toISOString() : null,
      accessLevel,
    };
  });

  return { items, total };
}