"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import StatCard from "@/components/StatCard";
import PriorityBadge from "@/components/PriorityBadge";
import EmptyState from "@/components/EmptyState";

function timeAgo(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AlertsPage() {
  const { role } = useAuth();
  const canEscalate = role === "super_admin" || role === "department_head" || role === "hr_admin";

  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, unacknowledged: 0, escalated: 0 });
  const [loading, setLoading] = useState(true);
  const [priority, setPriority] = useState("");
  const [ackFilter, setAckFilter] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (priority) params.set("priority", priority);
      if (ackFilter) params.set("acknowledged", ackFilter);
      params.set("limit", "50");
      const res = await fetch(`/api/notifications?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.notifications);
        setStats(json.stats);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [priority, ackFilter]);

  async function handleAcknowledge(id: string) {
    setActingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}/acknowledge`, { method: "PATCH" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not acknowledge");
        return;
      }
      toast.success("Acknowledged");
      load();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setActingId(null);
    }
  }

  async function handleEscalate(id: string) {
    setActingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}/escalate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not escalate");
        return;
      }
      toast.success("Escalated to leadership");
      load();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Alerts</h1>
          <p style={{ color: "var(--color-neutral-500)", marginTop: 4 }}>Everything pushed to you from Freshservice, Freshsales, and Freshdesk.</p>
        </div>
      </div>

      <div className="dashboard-stats-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Critical" value={stats.critical} />
        <StatCard label="Unacknowledged" value={stats.unacknowledged} />
        <StatCard label="Escalated" value={stats.escalated} />
      </div>

      <div className="filter-bar">
        <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          {["Critical", "Urgent", "High", "Medium", "Low", "Informational"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="form-select" value={ackFilter} onChange={(e) => setAckFilter(e.target.value)}>
          <option value="">All</option>
          <option value="false">Unacknowledged</option>
          <option value="true">Acknowledged</option>
        </select>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><span className="spinner" /></div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: "20px 24px" }}><EmptyState title="All clear" text="No alerts match this filter." /></div>
          ) : (
            <div>
              {notifications.map((n) => (
                <div key={n._id} style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-neutral-100)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <PriorityBadge priority={n.priority} />
                        {n.escalated && <span className="badge badge-rejected">Escalated</span>}
                        <span style={{ fontSize: "0.75rem", color: "var(--color-neutral-400)" }}>{n.source} · {timeAgo(n.createdAt)}</span>
                      </div>
                      <p style={{ fontWeight: 600 }}>{n.title}</p>
                      <p style={{ fontSize: "0.875rem", color: "var(--color-neutral-600)", marginTop: 2 }}>{n.message}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      {!n.acknowledged && (
                        <button className="btn btn-primary btn-sm" disabled={actingId === n._id} onClick={() => handleAcknowledge(n._id)}>Acknowledge</button>
                      )}
                      {canEscalate && !n.escalated && (
                        <button className="btn btn-secondary btn-sm" disabled={actingId === n._id} onClick={() => handleEscalate(n._id)}>Escalate</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}