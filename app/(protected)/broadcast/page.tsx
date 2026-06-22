"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import { DEPARTMENTS } from "@/lib/types";
import EmptyState from "@/components/EmptyState";

interface Broadcast {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  recipientGroup: string;
  recipientUserIds: string[];
}

export default function BroadcastPage() {
  const { role, department } = useAuth();
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", message: "", department: role === "department_head" ? department : "" });
  const [sending, setSending] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/broadcast");
      const json = await res.json();
      if (json.success) setHistory(json.broadcasts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.message) {
      toast.error("Title and message are required");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, message: form.message, department: form.department || undefined }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not send broadcast");
        return;
      }
      toast.success(json.message || "Broadcast sent");
      setForm({ title: "", message: "", department: role === "department_head" ? department : "" });
      load();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Broadcast Center</h1>
          <p style={{ color: "var(--color-neutral-500)", marginTop: 4 }}>Send a management-wide announcement, pushed instantly to everyone it reaches.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3>New Broadcast</h3></div>
        <form onSubmit={handleSend} className="card-body">
          <div className="form-group">
            <label className="form-label required">Title</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Office closed Friday" />
          </div>
          <div className="form-group">
            <label className="form-label required">Message</label>
            <textarea
            title="Enter the message for this broadcast"
             className="form-textarea" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Audience</label>
            <select
             title="Select the audience for this broadcast"
             className="form-select" value={form.department} disabled={role === "department_head"} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              <option value="">Everyone</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d} only</option>)}
            </select>
            {role === "department_head" && <p className="form-hint">You can only broadcast within your own department.</p>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Send Broadcast"}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header"><h3>History</h3></div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><span className="spinner" /></div>
          ) : history.length === 0 ? (
            <div style={{ padding: "20px 24px" }}><EmptyState title="No broadcasts yet" text="Sent announcements will show up here." /></div>
          ) : (
            <div>
              {history.map((b) => (
                <div key={b._id} style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-neutral-100)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <p style={{ fontWeight: 600 }}>{b.title}</p>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-400)" }}>{new Date(b.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-neutral-600)", marginTop: 4 }}>{b.message}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-neutral-400)", marginTop: 6 }}>
                    Sent to {b.recipientGroup === "all_staff" ? "everyone" : b.recipientGroup} · {b.recipientUserIds.length} recipient(s)
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}