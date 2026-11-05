import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export type SessionUser = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
} | null;

export function useSession() {
  return useQuery<SessionUser>({
    queryKey: ["session", "me"],
    queryFn: ({ signal }) => api.me(signal),   // always /auth/me via the helper
    // Make the session “sticky” so it doesn’t refetch on every focus/nav:
    staleTime: 5 * 60 * 1000,                  // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}
