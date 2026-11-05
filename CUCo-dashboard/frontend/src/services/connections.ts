/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiFetch } from "./api";
import { useCallback, useState } from "react";

export type RelationshipType =
  | "BEST_FRIEND"
  | "GOOD_FRIEND"
  | "PARTNER"
  | "PARENT"
  | "CHILD"
  | "SIBLING"
  | "AUNT_UNCLE"
  | "COUSIN"
  | "THERAPIST"
  | "DOCTOR"
  | "OTHER";

export type AccessLevel = "NONE" | "POSITIVE_ONLY" | "NEGATIVE_ONLY" | "FULL" | "CUSTOM";
export type ConnectionStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "BLOCKED" | "REVOKED";

export type ConnectionView = {
  id: string;
  ownerId: string;
  targetUserId: string | null;
  targetUser?: { id: string; username?: string; name?: string; email?: string } | null;
  contactId: string | null;
  contact?: { id: string; displayName?: string; email?: string | null } | null;
  relationship: RelationshipType;
  accessLevel: AccessLevel;
  /** For CUSTOM, the base level granted */
  customBase?: AccessLevel | null;
  /** Timed expiry (ISO string) */
  expiresAt?: string | null;
  status: ConnectionStatus;
  label?: string | null;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const CONN_BASE = "/v1/connections";
// --- add near other exports ---


/** Server → UI normalization */
function normalizeConnection(raw: any): ConnectionView {
  if (!raw) return raw;
  return {
    ...raw,
    customBase: raw.customBase ?? raw.custom_base ?? raw.access?.customBase ?? null,
    expiresAt: raw.expiresAt ?? raw.expires_at ?? raw.access?.expiresAt ?? null,
    contact:
      raw.contact ?? (raw.contactId ? { id: raw.contactId, displayName: raw.name } : null),
  };
}

/** Accept either an array or { items } */
function extractItems(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.items)) return res.items;
  return [];
}

export async function getConnections(): Promise<ConnectionView[]> {
  const res = await apiFetch(`${CONN_BASE}/connections`);
  return extractItems(res).map(normalizeConnection);
}

export async function createConnectionForUser(opts: {
  targetUserId: string;
  relationship: RelationshipType;
  accessLevel: AccessLevel;
  label?: string;
  invitedVia?: string;
}) {
  const res = await apiFetch(`${CONN_BASE}/connections/user`, {
    method: "POST",
    body: JSON.stringify(opts),
  });
  return normalizeConnection(res);
}

export async function createConnectionForContact(opts: {
  contact: { name: string; email?: string };
  relationship: RelationshipType;
  accessLevel: AccessLevel;
  label?: string;
  invitedVia?: string;
}) {
  const res = await apiFetch(`${CONN_BASE}/connections/contact`, {
    method: "POST",
    body: JSON.stringify(opts),
  });
  return normalizeConnection(res);
}

export async function inviteByEmail(opts: {
  email: string;
  relationship: RelationshipType;
  accessLevel: AccessLevel;
  label?: string;
  invitedVia?: string;
}) {
  const res = await apiFetch(`${CONN_BASE}/connections/invite`, {
    method: "POST",
    body: JSON.stringify(opts),
  });
  return normalizeConnection(res);
}

export async function patchConnection(opts: {
  id: string;
  patch: Partial<{
    relationship: RelationshipType;
    accessLevel: AccessLevel;
    customBase: AccessLevel | null;
    expiresAt: string | null; // ISO or null to clear
    label: string | null;
    note: string | null;
  }>;
}): Promise<ConnectionView> {
  const res = await apiFetch(`${CONN_BASE}/connections/${opts.id}`, {
    method: "PATCH",
    body: JSON.stringify(opts.patch),
  });
  return normalizeConnection(res);
}

export async function removeConnection(id: string): Promise<{ ok: true }> {
  await apiFetch(`${CONN_BASE}/connections/${id}`, { method: "DELETE" });
  return { ok: true };
}



/* ------------------------------------------------------------------
   Invite response helpers
------------------------------------------------------------------- */

export type InviteAction = "accept" | "decline";

/** Plain API helper; accepts either (id, action) or ({ id, action }) */
export async function respondToInvite(
  id: string,
  action: InviteAction
): Promise<ConnectionView>;
export async function respondToInvite(args: { id: string; action: InviteAction }): Promise<ConnectionView>;
export async function respondToInvite(
  a: string | { id: string; action: InviteAction },
  b?: InviteAction
): Promise<ConnectionView> {
  const id = typeof a === "string" ? a : a.id;
  const action = typeof a === "string" ? (b as InviteAction) : a.action;

  const res = await apiFetch(`${CONN_BASE}/connections/${id}/respond`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
  return normalizeConnection(res);
}

/** React hook wrapper (compatible with object or positional args) */
export function useRespondToInvite() {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // accept (id, action) or ({ id, action })
  const respond = useCallback(
    async (
      a: string | { id: string; action: InviteAction },
      b?: InviteAction
    ) => {
      setLoading(true);
      setError(null);
      try {
        return await respondToInvite(a as any, b as any);
      } catch (e: any) {
        const msg = e?.message ?? "Failed to update invitation";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const accept = useCallback((id: string) => respond(id, "accept"), [respond]);
  const decline = useCallback((id: string) => respond(id, "decline"), [respond]);

  // Allow:
  //   mutateAsync(id)                -> defaults to "accept"
  //   mutateAsync(id, action)
  //   mutateAsync({ id, action })
  function mutateAsync(id: string): Promise<ConnectionView>;
  function mutateAsync(id: string, action: InviteAction): Promise<ConnectionView>;
  function mutateAsync(args: { id: string; action: InviteAction }): Promise<ConnectionView>;
  function mutateAsync(
    a: string | { id: string; action: InviteAction },
    b?: InviteAction
  ): Promise<ConnectionView> {
    if (typeof a === "string") {
      return respond(a, (b ?? "accept") as InviteAction);
    }
    return respond({ id: a.id, action: a.action });
  }

  return { respond, accept, decline, mutateAsync, isLoading, error };
}

export async function renewConnection(id: string, expiresAt?: string | null) {
  const res = await apiFetch(`${CONN_BASE}/connections/${id}/renew`, {
    method: "POST",
    body: JSON.stringify({ expiresAt: expiresAt ?? null }),
  });
  return res;
}

export const isExpired = (expiresAt?: string | null) =>
  !!expiresAt && new Date(expiresAt).getTime() <= Date.now();
