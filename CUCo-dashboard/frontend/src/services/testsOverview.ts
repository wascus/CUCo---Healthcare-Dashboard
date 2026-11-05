/* eslint-disable @typescript-eslint/no-explicit-any */
// services/testsOverview.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";
import { useSession } from "./session";

/** Keep names identical to Prisma enum EmotionName */
export type EmotionName =
  | "Joy"
  | "Sadness"
  | "Anger"
  | "Fear"
  | "Hope"
  | "Love"
  | "Guilt"
  | "Acceptance"
  | "Confusion"
  | "Gratitude";

export interface EmotionEntryDTO {
  id: string;
  emotion: EmotionName;
  color: string;       // hex from the UI palette
  intensity: number;   // 1..10
  note: string | null;
  createdAt: string;   // ISO string
}

type EmotionsListResponse = {
  items: EmotionEntryDTO[];
  total?: number;
};

const QK = {
  list: (uid: string, limit: number) => ["testsOverview", "emotions", uid, limit] as const,
};

function getCurrentUid(qc: ReturnType<typeof useQueryClient>) {
  const me = qc.getQueryData<ReturnType<typeof useSession> extends any ? any : never>(["session", "me"]) as {
    id: string;
  } | null;
  return me?.id;
}

/** Fetch paged-ish list (limit only) */
export function useEmotions({ limit = 50 }: { limit?: number } = {}) {
  const { data: me } = useSession();
  const uid = me?.id ?? "_guest";
  return useQuery<EmotionsListResponse>({
    queryKey: QK.list(uid, limit),
    queryFn: () => apiFetch<EmotionsListResponse>(`/v1/tests-overview/emotions?limit=${limit}`),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

/** Create a new emotion entry */
export function useCreateEmotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: {
      emotion: EmotionName;
      color: string;
      intensity: number;
      note?: string | null;
    }) =>
      apiFetch<EmotionEntryDTO>("/v1/tests-overview/emotions", {
        method: "POST",
        body: p,
      }),
    onSuccess: () => {
      const uid = getCurrentUid(qc);
      if (!uid) return;
      // Invalidate all cached limits for this user
      const keys = qc.getQueryCache().findAll({ predicate: (q) => {
        const k = q.queryKey as any[];
        return k[0] === "testsOverview" && k[1] === "emotions" && k[2] === uid;
      }});
      for (const k of keys) qc.invalidateQueries({ queryKey: k.queryKey });
    },
  });
}
