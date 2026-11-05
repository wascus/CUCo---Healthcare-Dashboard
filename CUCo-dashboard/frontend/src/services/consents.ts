/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiFetch } from "./api";

const BASE = "/v1"; // apiFetch adds /api → /api/v1/...

export type Placement = "base" | "middle" | "summit";

export type SharedTopic = {
  id: string;
  title: string;
  description?: string | null;
  status: "draft" | "published" | string;
  placement: Placement;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ViewerUser = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
};

export type ViewerCard = {
  id: string;                 // connection/share id or row id
  fromUser: ViewerUser;       // the owner (person sharing to me)
  label?: string | null;      // relationship label / group name (optional)
  acceptedAt: string;         // when I got access
  expiresAt?: string | null;  // added for expiry chip
  accessLevel?: string | null;
};

function extractItems(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.items)) return res.items;
  return [];
}

function normalizeViewerCard(v: any): ViewerCard {
  return {
    id: v.id ?? v.connectionId ?? v.shareId ?? crypto.randomUUID(),
    fromUser: {
      id: v.fromUser?.id ?? v.owner?.id ?? v.ownerId ?? v.owner_id ?? "",
      name: v.fromUser?.name ?? v.owner?.name ?? null,
      username: v.fromUser?.username ?? v.owner?.username ?? null,
      email: v.fromUser?.email ?? v.owner?.email ?? null,
    },
    label: v.label ?? v.groupLabel ?? v.relationshipLabel ?? null,
    acceptedAt: v.acceptedAt ?? v.createdAt ?? v.updatedAt ?? new Date().toISOString(),
    // normalize common variants
    expiresAt: v.expiresAt ?? v.expires_at ?? v.access?.expiresAt ?? null,
    accessLevel: v.accessLevel ?? v.access_level ?? v.access?.level ?? null,
  };
}

/** People who share data with *me* (viewer) */
export async function getViewers(signal?: AbortSignal): Promise<ViewerCard[]> {
  const res = await apiFetch(`${BASE}/viewers`, { signal });
  return extractItems(res).map(normalizeViewerCard);
}

/** All topics shared to me by a specific owner */
export async function getSharedTopics(
  ownerId: string,
  signal?: AbortSignal
): Promise<SharedTopic[]> {
  const res = await apiFetch(`${BASE}/viewers/${ownerId}/topics`, { signal });
  return extractItems(res).map((t: any) => ({
    id: t.id,
    title: t.title ?? "(untitled)",
    description: t.description ?? null,
    status: t.status ?? "published",
    placement: (t.placement as Placement) ?? "base",
    createdAt: t.createdAt ?? null,
    updatedAt: t.updatedAt ?? null,
  }));
}
