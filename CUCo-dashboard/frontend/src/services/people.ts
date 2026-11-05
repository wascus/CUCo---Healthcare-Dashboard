// import { useQuery } from "@tanstack/react-query";

// export type Role = "individual" | "friend" | "doctor" | "acquaintance";
// export type RelationType = "friend" | "family" | "doctor" | "acquaintance";

// export interface Person {
//   id: string;
//   fullName: string;
//   role: Role;
//   email?: string;
//   phone?: string;
//   avatarUrl?: string;
//   tags?: string[];
// }
// export interface Edge {
//   from: string;
//   to: string;
//   type: RelationType;
//   strength?: number;
// }

// const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
//   const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...init });
//   if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
//   return res.json() as Promise<T>;
// };

// export function usePeopleList(params?: { search?: string; limit?: number; offset?: number }) {
//   const qs = new URLSearchParams();
//   if (params?.search) qs.set("search", params.search);
//   if (params?.limit)  qs.set("limit",  String(params.limit));
//   if (params?.offset) qs.set("offset", String(params.offset));
//   const key = ["people", params];
//   const url = `/api/v1/people${qs.toString() ? `?${qs.toString()}` : ""}`;
//   return useQuery({ queryKey: key, queryFn: () => api<{ items: Person[]; total: number; limit: number; offset: number }>(url), staleTime: 60_000 });
// }

// export function usePerson(id?: string) {
//   return useQuery({
//     queryKey: ["people", id],
//     queryFn: () => api<Person>(`/api/v1/people/${id}`),
//     enabled: !!id,
//     staleTime: 60_000,
//   });
// }

// export function usePersonRelations(id?: string) {
//   return useQuery({
//     queryKey: ["people", id, "relations"],
//     queryFn: () => api<{ personId: string; nodes: Person[]; edges: Edge[] }>(`/api/v1/people/${id}/relations`),
//     enabled: !!id,
//     staleTime: 60_000,
//   });
// }

// services/people.ts
import { useQuery } from "@tanstack/react-query";
import { API_URL } from "./api"; // adjust the relative path if needed

type LookupResponse = {
  found: boolean;
  user: { id: string; email: string; name?: string; username?: string } | null;
};

export function useLookupUserByEmail(rawEmail: string | null) {
  const email = rawEmail?.trim().toLowerCase() ?? null;
  const enabled = !!email && /\S+@\S+\.\S+/.test(email); // simple email gate

  return useQuery<LookupResponse>({
    queryKey: ["people.lookup", email],
    enabled,
    queryFn: async () => {
      const base = API_URL.startsWith("http") ? API_URL : window.location.origin + API_URL;
      const url = new URL(`${base}/v1/people/lookup`);
      url.searchParams.set("email", email!);
      url.searchParams.set("_", Date.now().toString()); // cache-buster like your request() does

      const res = await fetch(url.toString(), {
        credentials: "include", // keep cookie session like your other calls
      });
      if (!res.ok) {
        // surface a useful error
        const body = await res.text().catch(() => "");
        throw new Error(`Lookup failed (${res.status}) ${body || ""}`.trim());
      }
      return (await res.json()) as LookupResponse;
    },
    // Optional: tune caching
    staleTime: 60_000,
  });
}



