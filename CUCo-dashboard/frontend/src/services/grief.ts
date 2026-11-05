
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";
import { useSession } from "./session";
import type { Topic } from "../types/grief";
export type Placement = "base" | "middle" | "summit";
export type Status = "text" | "check" | "tear" | "image";

export type CatalogTopic = { id: string; key: string; title: string; promptText?: string; isCustom?: boolean };
export type UserTopic = {
  id: string;
  topicId: string | null;
  title: string;
  isCustom: boolean;
  placement: Placement;
  status: Status;
  createdAt:string;
  updatedAt:string;
  shared: boolean;
};

const QK = {
  catalog: ["grief", "catalog"] as const,
  userTopics: (uid: string) => ["grief", "userTopics", uid] as const,
};

function getCurrentUid(qc: ReturnType<typeof useQueryClient>) {
  const me = qc.getQueryData<{ id: string } | null>(["session", "me"]);
  return me?.id;
}

/* Catalog (global) */
export function useGriefTopicsCatalog() {
  return useQuery<CatalogTopic[]>({
    queryKey: QK.catalog,
    queryFn: () => apiFetch<CatalogTopic[]>("/v1/catalog/grief-topics"),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

/* User topics (per user) */
export function useUserTopics() {
  const { data: me } = useSession();
  const uid = me?.id;
  return useQuery<UserTopic[]>({
    queryKey: uid ? QK.userTopics(uid) : ["grief", "userTopics", "_pending"],
    enabled: !!uid,
    queryFn: () => apiFetch<UserTopic[]>("/v1/grief/topics"),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

/* Add */
export function useAddTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      topicId: string; placement: Placement; status: Status; createdAt?: string;updatedAt?:string; shared?: boolean;
    }) => apiFetch<UserTopic>("/v1/grief/topics", {
      method: "POST", body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      const uid = getCurrentUid(qc);
      if (uid) qc.invalidateQueries({ queryKey: QK.userTopics(uid) });
    },
  });
}

/* Add custom topic */
export function useAddCustomTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      customTitle: string; placement: Placement; status: Status; shared?: boolean;
    }) => apiFetch<UserTopic>("/v1/grief/topics/custom", {
      method: "POST", body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      const uid = getCurrentUid(qc);
      if (uid) qc.invalidateQueries({ queryKey: QK.userTopics(uid) });
    },
  });
}

/* Update placement (PUT /topics/:id) */
export function useUpdateTopicPlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, placement }: { id: string; placement: Placement }) =>
      apiFetch<UserTopic>(`/v1/grief/topics/${id}`, {
        method: "PUT",
        body: JSON.stringify({ placement }),
      }),
    onMutate: async ({ id, placement }) => {
      const uid = getCurrentUid(qc);
      if (!uid) return;
      const key = QK.userTopics(uid);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<UserTopic[]>(key) ?? [];
      qc.setQueryData<UserTopic[]>(
        key,
        prev.map((t) => (t.id === id ? { ...t, placement } : t))
      );
      return { key, prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.key && ctx?.prev) qc.setQueryData(ctx.key, ctx.prev); },
    onSettled: () => {
      const uid = getCurrentUid(qc);
      if (uid) qc.invalidateQueries({ queryKey: QK.userTopics(uid) });
    },
  });
}
export function useUpdateTopicDescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, description }: { id: string; description: string | null }) =>
      updateTopicDescription(id, description),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["griefUserTopics"] }),
  });
}

/* Delete */
export function useRemoveTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/v1/grief/topics/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      const uid = getCurrentUid(qc);
      if (!uid) return;
      const key = QK.userTopics(uid);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<UserTopic[]>(key) ?? [];
      qc.setQueryData<UserTopic[]>(key, prev.filter((t) => t.id !== id));
      return { key, prev };
    },
    onError: (_e, _id, ctx) => { if (ctx?.key && ctx?.prev) qc.setQueryData(ctx.key, ctx.prev); },
    onSettled: () => {
      const uid = getCurrentUid(qc);
      if (uid) qc.invalidateQueries({ queryKey: QK.userTopics(uid) });
    },
  });
}
export function updateTopicDescription(id: string, description: string | null) {
  return apiFetch<Topic>(`/v1/grief/topics/${id}/description`, {
    method: "PATCH",
    body: { description },
  });
}