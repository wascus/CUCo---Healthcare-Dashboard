/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "./api";

export type Notification = {
  id: string;
  type: string; 
  title?: string | null;
  payload?: any;
  createdAt: string;
  readAt?: string | null;
  status: "UNREAD" | "READ";
  actor?: { id: string; name?: string | null; username?: string | null } | null;
  connection?: { id: string } | null;
};

function mapNotification(n: any): Notification {
  return {
    id: n.id,
    type: n.type,
    title: n.title ?? null,
    payload: n.payload ?? null,
    createdAt: n.createdAt,
    readAt: n.readAt ?? null,
    status: n.readAt ? "READ" : "UNREAD",
    actor: n.actor ?? null,
    connection: n.connection ?? null,
  };
}

export function useNotifications(take = 50) {
  return useQuery<Notification[]>({
    queryKey: ["notifications", take],
    refetchInterval: 10000, // poll every 10s
    queryFn: async () => {
      const url = new URL(`${API_URL}/v1/notifications`);
      url.searchParams.set("take", String(take));
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load notifications (${res.status})`);
      const data = await res.json();
      return Array.isArray(data) ? data.map(mapNotification) : [];
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/v1/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" }, // keep header...
        body: "{}",                                      // ...then send a tiny body
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Failed to mark read (${res.status}) ${body}`);
      }
      return res.json();
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/v1/notifications/read-all`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to mark all read (${res.status})`);
      return res.json().catch(() => ({}));
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/v1/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.text().catch(() => "");
        throw new Error(`Failed to delete (${res.status}) ${body}`);
      }
      return true;
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
