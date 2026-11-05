export function fmtRemaining(expiresAt?: string | null) {
  if (!expiresAt) return null;
  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = end - now;
  if (isNaN(end)) return null;
  if (diff <= 0) return "expired";
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  const hr = h % 24;
  const min = Math.floor((diff % 3600000) / 60000);
  if (d >= 1) return `in ${d}d ${hr}h`;
  if (h >= 1) return `in ${h}h ${min}m`;
  return `in ${min}m`;
  }
  export function toLocalInputValue(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }
  export function addMinutesToLocalString(dtLocal: string, minutes: number) {
  const base = new Date(dtLocal);
  if (isNaN(base.getTime())) {
  const now = new Date();
  return toLocalInputValue(new Date(now.getTime() + minutes * 60000));
  }
  const next = new Date(base.getTime() + minutes * 60000);
  return toLocalInputValue(next);
  }
  