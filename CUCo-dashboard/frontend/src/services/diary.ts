/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/diary.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useSession } from "./session";

/* ------------ Types ------------ */
export type NoteKind = "EMOTIONAL" | "POSITIVE";

export interface DiaryNoteDTO {
  id: string;
  title: string;
  content: string;
  shared: boolean;
  createdAt: string; // ISO
  kind: NoteKind;
}

export interface ListResponse {
  items: DiaryNoteDTO[];
  nextCursor?: string;
}

/* ----------- Query Keys ----------- */
const QK = {
  notes: (uid: string, kind?: NoteKind, shared?: boolean) =>
    ["diary", "notes", uid, kind ?? "_all", String(shared ?? "_any")] as const,
};

function getCurrentUid(qc: ReturnType<typeof useQueryClient>) {
  const me = qc.getQueryData<{ id: string } | null>(["session", "me"]);
  return me?.id;
}

/* ------------- List -------------- */
export function useDiaryNotes(params?: {
  kind?: NoteKind;
  shared?: boolean;
  limit?: number;
  cursor?: string;
}) {
  const { data: me } = useSession();
  const uid = me?.id;

  const search = new URLSearchParams();
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.cursor) search.set("cursor", params.cursor);
  if (params?.kind) search.set("kind", params.kind);
  if (typeof params?.shared === "boolean") search.set("shared", String(params.shared));

  return useQuery<ListResponse>({
    queryKey: uid ? QK.notes(uid, params?.kind, params?.shared) : ["diary", "notes", "_pending"],
    enabled: !!uid,
    queryFn: () => api.get<ListResponse>(`/v1/diary-notes${search.toString() ? `?${search}` : ""}`),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

/* ------------- Create ------------- */
export function useCreateDiaryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      title: string;
      content: string;
      kind: NoteKind;
      shared?: boolean;
    }) => api.post<DiaryNoteDTO>("/v1/diary-notes", payload),

    onSuccess: () => {
      const uid = getCurrentUid(qc);
      if (uid) qc.invalidateQueries({ queryKey: ["diary", "notes", uid], exact: false });
    },
  });
}

/* ------------- Delete ------------- */
export function useDeleteDiaryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/v1/diary-notes/${id}`),

    onMutate: async (id) => {
      const uid = getCurrentUid(qc);
      if (!uid) return;
      const keyPrefix = ["diary", "notes", uid];

      await qc.cancelQueries({ queryKey: keyPrefix, exact: false });

      const affected = qc.getQueryCache().findAll({ queryKey: keyPrefix, exact: false }).map(q => q.queryKey);
      const snapshots = new Map<any, ListResponse | undefined>();

      for (const key of affected) {
        const data = qc.getQueryData<ListResponse>(key);
        snapshots.set(key, data);
        if (data) {
          qc.setQueryData<ListResponse>(key, { ...data, items: data.items.filter(n => n.id !== id) });
        }
      }
      return { affected, snapshots };
    },

    onError: (_e, _id, ctx) => {
      if (!ctx) return;
      for (const key of ctx.affected ?? []) {
        const prev = ctx.snapshots?.get(key);
        if (prev) qc.setQueryData<ListResponse>(key, prev);
      }
    },

    onSettled: () => {
      const uid = getCurrentUid(qc);
      if (uid) qc.invalidateQueries({ queryKey: ["diary", "notes", uid], exact: false });
    },
  });
}
