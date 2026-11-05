/* eslint-disable @typescript-eslint/no-explicit-any */


export const API_URL = import.meta.env.VITE_API_URL || "/api";

export type SessionUser = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
} | null;

// ---------- Types ----------
export type ApiRequestInit = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;              // <-- allow plain objects
  headers?: HeadersInit;
};

// ---------- Helpers ----------
function joinUrl(base: string, path: string) {
  const cleanBase = base.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

function isIdempotent(method?: string) {
  const m = (method || "GET").toUpperCase();
  return m === "GET" || m === "HEAD";
}

function normalizeBody(body: unknown) {
  if (body == null) return undefined;
  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer
  ) {
    return body;
  }
  return JSON.stringify(body);
}

// ---------- Core fetch ----------
export async function apiFetch<T>(path: string, options: ApiRequestInit = {}): Promise<T> {
  const base = API_URL.startsWith("http") ? API_URL : window.location.origin + API_URL;
  const url = new URL(joinUrl(base, path));
  if (isIdempotent(options.method)) url.searchParams.set("_", String(Date.now()));

  const headers = new Headers(options.headers);
  const body = normalizeBody(options.body);
  if (body != null && typeof body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const res = await fetch(url.toString(), {
      credentials: "include",
      cache: "no-store",
      ...options,
      headers,
      body,
    });

    if (res.status === 204) return undefined as T;

    const data = await res.json().catch(() => ({} as unknown));
    if (!res.ok) {
      const message = (data as any)?.message || res.statusText || "Request failed";
      throw Object.assign(new Error(message), { status: res.status });
    }
    return data as T;
  } catch (err: any) {
    // Tag aborts so callers can safely ignore
    if (err?.name === "AbortError" || err?.code === 20) {
      err.__aborted = true;
    }
    throw err;
  }
}

// ---------- Auth (unchanged usage; now properly typed) ----------
export const api = {
  register: (p: { email: string; password: string; name?: string; username: string }) =>
    apiFetch("/auth/register", { method: "POST", body: p }),
  login: (p: { email: string; password: string }) =>
    apiFetch("/auth/login", { method: "POST", body: p }),
  me: (signal?: AbortSignal) => apiFetch<SessionUser>("/auth/me", { signal }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  getHistory:   <T>(path: string, options: Omit<ApiRequestInit, "method"> = {}) =>
    apiFetch<T>("/v1"+path, { ...options, method: "GET" }),
  // Optional convenience helpers
  get:   <T>(path: string, options: Omit<ApiRequestInit, "method"> = {}) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post:  <T>(path: string, body?: unknown, options: Omit<ApiRequestInit, "method" | "body"> = {}) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options: Omit<ApiRequestInit, "method" | "body"> = {}) =>
    apiFetch<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options: Omit<ApiRequestInit, "method" | "body"> = {}) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body }),
  del:   <T>(path: string, options: Omit<ApiRequestInit, "method"> = {}) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};
