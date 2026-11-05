/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";

export function useAsync<T>(fn: () => Promise<T>, deps: any[]) {
const [data, setData] = useState<T | null>(null);
const [isLoading, setLoading] = useState(false);
const [error, setError] = useState<unknown>(null);
useMemo(() => {
let cancelled = false;
setLoading(true);
setError(null);
fn()
.then((d) => !cancelled && setData(d))
.catch((e) => !cancelled && setError(e))
.finally(() => !cancelled && setLoading(false));
return () => { cancelled = true; };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, deps);
return { data, isLoading, error, refetch: () => fn().then(setData) };
}