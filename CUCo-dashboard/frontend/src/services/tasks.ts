
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useSession } from "./session";

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskTypeEnum = 'SHORT_TERM' | 'LONG_TERM';

export interface TaskDTO {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  taskType: TaskTypeEnum;
  scheduledDate?: string; // ISO
  scheduledTime?: string; // HH:mm format
  completed: boolean;
  createdAt: string; // ISO
  completedAt?: string; // ISO
}

const QK = {
  tasks: (uid: string) => ["tasks", uid] as const,
};

function getCurrentUid(qc: ReturnType<typeof useQueryClient>) {
  const me = qc.getQueryData<{ id: string } | null>(["session", "me"]);
  return me?.id;
}

export function useTasks() {
  const { data: me } = useSession();
  const uid = me?.id;

  return useQuery<TaskDTO[]>({
    queryKey: uid ? QK.tasks(uid) : ["tasks", "_pending"],
    enabled: !!uid,
    queryFn: () => api.get<TaskDTO[]>("/v1/tasks"),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      taskType?: TaskTypeEnum;
      scheduledDate?: string;
      scheduledTime?: string;
    }) => api.post<TaskDTO>("/v1/tasks", payload),

    onSuccess: () => {
      const uid = getCurrentUid(qc);
      if (uid) qc.invalidateQueries({ queryKey: QK.tasks(uid) });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: {
      id: string;
      title?: string;
      description?: string;
      priority?: TaskPriority;
      taskType?: TaskTypeEnum;
      scheduledDate?: string;
      scheduledTime?: string;
      completed?: boolean;
    }) => api.patch<TaskDTO>(`/v1/tasks/${id}`, payload),

    onSuccess: () => {
      const uid = getCurrentUid(qc);
      if (uid) qc.invalidateQueries({ queryKey: QK.tasks(uid) });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/v1/tasks/${id}`),

    onSuccess: () => {
      const uid = getCurrentUid(qc);
      if (uid) qc.invalidateQueries({ queryKey: QK.tasks(uid) });
    },
  });
}
