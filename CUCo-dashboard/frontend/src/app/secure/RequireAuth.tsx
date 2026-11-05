import { useEffect, useState, type PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api"; 

export function RequireAuth({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    let mounted = true;
    api.me()
      .then(() => {
        if (!mounted) return;
        setOk(true);
      })
      .catch(() => {
        const next = encodeURIComponent(loc.pathname + loc.search + loc.hash);
        nav(`/login?next=${next}`);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [loc.pathname, loc.search, loc.hash, nav]);

  if (loading) return null; 
  return ok ? <>{children}</> : null;
}
