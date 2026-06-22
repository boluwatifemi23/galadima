"use client";

import { useCallback, useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";

const CATEGORIES = ["kpi", "submission", "template", "user", "department", "notification", "auth"];

interface AuditLog {
  _id: string;
  createdAt: string;
  user?: { name: string };
  category: string;
  action: string;
  resourceType: string;
}

function humanizeAction(action: string) {
  return action.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("page", String(page));
    fetch(`/api/audit?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          setError(json.error || "Could not load audit log");
          return;
        }
        setLogs(json.logs);
        setPagination(json.pagination);
      })
      .catch(() => setError("Could not reach the server"))
      .finally(() => setLoading(false));
  }, [category, page]);

  useEffect(() => { load(); }, [load]);

  if (error) return <EmptyState title="Can't show the audit log" text={error} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Audit Log</h1>
          <p style={{ color: "var(--color-neutral-500)", marginTop: 4 }}>Every KPI change, approval, notification, and account action — in order.</p>
        </div>
      </div>

      <div className="filter-bar">
        <select
        title="Filter by Category"
         className="form-select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><span className="spinner" /></div>
          ) : logs.length === 0 ? (
            <div style={{ padding: "20px 24px" }}><EmptyState title="No activity yet" text="Actions will show up here as people use the system." /></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>When</th><th>Who</th><th>Category</th><th>Action</th><th>Resource</th></tr></thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.user?.name || "System"}</td>
                    <td><span className="badge badge-neutral">{log.category}</span></td>
                    <td>{humanizeAction(log.action)}</td>
                    <td>{log.resourceType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "16px 24px", borderTop: "1px solid var(--color-neutral-100)" }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)", alignSelf: "center" }}>Page {page} of {pagination.totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}