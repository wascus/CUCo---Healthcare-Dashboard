import { useEffect, useState } from "react";
import { api } from "../../services/api";

type AccessReq = {
  id: string;
  personEmail?: string | null;
  personName?: string | null;
  status: "READ" | "UNREAD";
  payload: "EMAIL" | "ID";
  createdAt: string;
  readAt?: string | null;
  accessLevel? : string | null;
};

export default function HistoryTab() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [rows, setRows] = useState<AccessReq[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    let abort = new AbortController();
    setLoading(true);
    api
      .getHistory<{ items: AccessReq[]; total: number }>(
        `/connections/requests/history?page=${page}&pageSize=${pageSize}`,
        { signal: abort.signal }
      )
      .then((r) => {
        setRows(r.items || []);
        setTotal(r.total || 0);
      })
      .catch((e) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) console.error(e);
      })
      .finally(() => setLoading(false));
    return () => abort.abort();
  }, [page]);

  return (
    <section className="ma card">
      <h2>History</h2>
      <p className="ma help">Access requests you sent to view someone’s data.</p>

      <div className="ma table-wrap">
        <table className="ma table">
          <thead>
            <tr>
              <th>Person email</th>
              <th>Person name</th>
              <th>Status</th>
              <th>Access Level</th>
              <th>Payload</th>
              <th>Created at</th>
              <th>Read at</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6}>Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={6}>No history yet</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.personEmail ?? "—"}</td>
                <td>{r.personName ?? "—"}</td>
                <td>{r.status.toLowerCase()}</td>
                <td>{r.accessLevel?.toLocaleLowerCase()}</td>
                <td>{r.payload.toLowerCase()}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>{r.readAt ? new Date(r.readAt).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ma pager">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span>{page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </section>
  );
}
