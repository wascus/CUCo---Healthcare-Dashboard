import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import type { AuthUser } from "../../types/auth";

type Ctx = {
  user: AuthUser | null;
  ready: boolean;
  setUser: (u: AuthUser | null) => void;
  logout: () => Promise<void>;
};
const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Initial session fetch
  useEffect(() => {
    let mounted = true;
    api.me()
      .then((u) => mounted && setUser(u as AuthUser))
      .catch(() => mounted && setUser(null))
      .finally(() => mounted && setReady(true));
    return () => { mounted = false; };
  }, []);

  const value = useMemo<Ctx>(() => ({
    user,
    ready,
    setUser,
    logout: async () => {
      await api.logout().catch(() => {});
      setUser(null);
      window.dispatchEvent(new StorageEvent("storage", { key: "auth-sync", newValue: "logout" }));
    },
  }), [user, ready]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth-sync") {
        if (e.newValue === "logout") setUser(null);
        if (e.newValue?.startsWith("login:")) {
          try { setUser(JSON.parse(e.newValue.slice(6))); } catch {}
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
