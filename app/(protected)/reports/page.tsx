"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import { DEPARTMENTS } from "@/lib/types";
import EmptyState from "@/components/EmptyState";
import { formatDate } from "@/lib/constants";
import type { ReportType } from "@/lib/models/Report";

interface ReportHistoryItem {
  _id: string;
  reportType: ReportType;
  periodStart: string;
  periodEnd: string;
  recipientEmails: string[];
  generatedBy?: { name: string };
  pdfUrl?: string;
  sheetUrl?: string;
  emailSent: boolean;
}

const REPORT_TYPES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

export default function ReportsPage() {
  const { role } = useAuth();
  const isSuperAdmin = role === "super_admin";

  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateForm, setGenerateForm] = useState({ reportType: "weekly", department: "" });
  const [generating, setGenerating] = useState(false);

  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState("");
  const [savingRecipients, setSavingRecipients] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const json = await res.json();
      if (json.success) setHistory(json.reports);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setHistory(json.reports);
      })
      .finally(() => setLoading(false));

    if (isSuperAdmin) {
      fetch("/api/reports/settings").then((res) => res.json()).then((json) => json.success && setRecipients(json.reportRecipientEmails));
    }
  }, [isSuperAdmin]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: generateForm.reportType, department: generateForm.department || undefined }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not generate report");
        return;
      }
      toast.success("Report generated and emailed");
      load();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setGenerating(false);
    }
  }

  async function saveRecipients(updated: string[]) {
    setSavingRecipients(true);
    try {
      const res = await fetch("/api/reports/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportRecipientEmails: updated }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not save recipients");
        return;
      }
      setRecipients(updated);
      toast.success("Recipients updated");
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setSavingRecipients(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p style={{ color: "var(--color-neutral-500)", marginTop: 4 }}>
            Weekly, monthly, quarterly, and annual reports — generated and emailed automatically. You can also trigger one manually below.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3>Generate Now</h3></div>
        <form onSubmit={handleGenerate} className="card-body form-grid-2">
          <div className="form-group">
            <label className="form-label">Report Type</label>
            <select
                title="Report Type"
             className="form-select" value={generateForm.reportType} onChange={(e) => setGenerateForm({ ...generateForm, reportType: e.target.value })}>
              {REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Department (optional)</label>
            <select
                title="Department"
             className="form-select" value={generateForm.department} onChange={(e) => setGenerateForm({ ...generateForm, department: e.target.value })}>
              <option value="">Whole company</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit" className="btn btn-primary" disabled={generating}>
              {generating ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Generate & Send"}
            </button>
          </div>
        </form>
      </div>

      {isSuperAdmin && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3>Report Recipients</h3></div>
          <div className="card-body">
            <p style={{ fontSize: "0.875rem", color: "var(--color-neutral-600)", marginBottom: 10 }}>
              Every Super Admin gets every report automatically. Add anyone else who should be cc&apos;d.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input className="form-input" type="email" placeholder="someone@harmonygarden.com" value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)} />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={savingRecipients}
                onClick={() => {
                  if (!newRecipient.trim() || recipients.includes(newRecipient.trim())) return;
                  saveRecipients([...recipients, newRecipient.trim()]);
                  setNewRecipient("");
                }}
              >
                Add
              </button>
            </div>
            {recipients.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: "var(--color-neutral-400)" }}>No extra recipients yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {recipients.map((email) => (
                  <div key={email} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem", background: "var(--color-neutral-50)", padding: "6px 10px", borderRadius: "var(--radius-md)" }}>
                    {email}
                    <button disabled={savingRecipients} onClick={() => saveRecipients(recipients.filter((r) => r !== email))} style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontSize: "0.75rem" }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h3>History</h3></div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><span className="spinner" /></div>
          ) : history.length === 0 ? (
            <div style={{ padding: "20px 24px" }}><EmptyState title="No reports yet" text="Generated reports will show up here." /></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Type</th><th>Period</th><th>Recipients</th><th>Generated By</th><th></th></tr></thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r._id}>
                    <td style={{ textTransform: "capitalize" }}>{r.reportType}</td>
                    <td>{formatDate(r.periodStart)} – {formatDate(r.periodEnd)}</td>
                   <td>{r.recipientEmails.length}</td>
                    <td>{r.generatedBy?.name || "Automated"}</td>
                    <td style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {r.pdfUrl && <a href={r.pdfUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">PDF</a>}
                      {r.sheetUrl && <a href={r.sheetUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Sheet</a>}
                      {!r.emailSent && <span className="badge badge-rejected" title="No recipients configured, or the send failed">Not Emailed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}