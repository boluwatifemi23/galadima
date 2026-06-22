"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import RatingBadge from "@/components/RatingBadge";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import { formatDate } from "@/lib/constants";
import type { PerformanceRating } from "@/lib/types";

interface AppraisalListItem {
  _id: string;
  employee?: { name: string };
  periodStart: string;
  periodEnd: string;
  kpiScore: number;
  totalScore: number;
  rating: PerformanceRating;
}

interface EmployeeOption {
  _id: string;
  name: string;
  department: string;
}

export default function AppraisalsPage() {
  const { role, department } = useAuth();
  const canCreate = role === "super_admin" || role === "hr_admin" || role === "department_head";

  const [appraisals, setAppraisals] = useState<AppraisalListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [form, setForm] = useState({
    employeeId: "", periodStart: "", periodEnd: "",
    attendanceScore: 100, complianceScore: 100, managerReviewScore: 80, peerReviewScore: 80,
    managerNotes: "", promotionRecommended: false, bonusRecommended: false, bonusNotes: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/appraisals?limit=50");
      const json = await res.json();
      if (json.success) setAppraisals(json.appraisals);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch("/api/appraisals?limit=50")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setAppraisals(json.appraisals);
      })
      .finally(() => setLoading(false));

    if (canCreate) {
      const params = role === "department_head" ? `?department=${encodeURIComponent(department)}` : "";
      fetch(`/api/users${params}`).then((res) => res.json()).then((json) => json.success && setEmployees(json.users));
    }
  }, [canCreate, role, department]);

  function openCreate() {
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);
    setForm({
      employeeId: "",
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10),
      attendanceScore: 100, complianceScore: 100, managerReviewScore: 80, peerReviewScore: 80,
      managerNotes: "", promotionRecommended: false, bonusRecommended: false, bonusNotes: "",
    });
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || !form.periodStart || !form.periodEnd) {
      toast.error("Employee and period are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/appraisals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not create appraisal");
        return;
      }
      toast.success(`Appraisal created — ${json.appraisal.totalScore}% (${json.appraisal.rating.replace(/_/g, " ")})`);
      setFormOpen(false);
      load();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Appraisals</h1>
          <p style={{ color: "var(--color-neutral-500)", marginTop: 4 }}>KPI Performance 60% · Attendance 10% · Compliance 10% · Manager Review 10% · Peer Review 10%.</p>
        </div>
        {canCreate && <button className="btn btn-primary" onClick={openCreate}>+ New Appraisal</button>}
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><span className="spinner" /></div>
          ) : appraisals.length === 0 ? (
            <div style={{ padding: "20px 24px" }}><EmptyState title="No appraisals yet" text="Create one to score an employee's overall performance for a period." /></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Period</th><th>KPI Score</th><th>Total</th><th>Rating</th><th></th></tr></thead>
              <tbody>
                {appraisals.map((a) => (
                  <tr key={a._id}>
                    <td>{a.employee?.name}</td>
                    <td>{formatDate(a.periodStart)} – {formatDate(a.periodEnd)}</td>
                    <td>{a.kpiScore}%</td>
                    <td style={{ fontWeight: 600 }}>{a.totalScore}%</td>
                    <td><RatingBadge rating={a.rating} /></td>
                    <td><Link href={`/appraisals/${a._id}`} className="btn btn-ghost btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {formOpen && (
        <Modal
          title="New Appraisal"
          onClose={() => setFormOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Create Appraisal"}
              </button>
            </>
          }
        >
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label required">Employee</label>
              <select
              title="Employee"
               className="form-select" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                <option value="">Select employee</option>
                {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name} — {emp.department}</option>)}
              </select>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label required">Period Start</label>
                <input
                title="Period Start"
                 type="date" className="form-input" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label required">Period End</label>
                <input
                title="Period End"
                 type="date" className="form-input" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
              </div>
            </div>
            <p className="form-hint" style={{ marginBottom: 12 }}>
              KPI Performance (60% of the total) is calculated automatically from approved KPIs in this period — you only need to score the rest.
            </p>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Attendance (10%)</label>
                <input
                title="Attendance"
                 type="number" min={0} max={100} className="form-input" value={form.attendanceScore} onChange={(e) => setForm({ ...form, attendanceScore: Number(e.target.value) })} />
                
              </div>
              <div className="form-group">
                <label className="form-label">Compliance (10%)</label>
                <input
                title="Compliance"
                 type="number" min={0} max={100} className="form-input" value={form.complianceScore} onChange={(e) => setForm({ ...form, complianceScore: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Manager Review (10%)</label>
                <input
                title="Manager Review"
                 type="number" min={0} max={100} className="form-input" value={form.managerReviewScore} onChange={(e) => setForm({ ...form, managerReviewScore: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Peer Review (10%)</label>
                <input
                title="Peer Review"
                 type="number" min={0} max={100} className="form-input" value={form.peerReviewScore} onChange={(e) => setForm({ ...form, peerReviewScore: Number(e.target.value) })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Manager Notes</label>
              <textarea
                title="Manager Notes"
               className="form-textarea" value={form.managerNotes} onChange={(e) => setForm({ ...form, managerNotes: e.target.value })} />
            </div>
            <div className="form-grid-2">
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem" }}>
                <input type="checkbox" checked={form.promotionRecommended} onChange={(e) => setForm({ ...form, promotionRecommended: e.target.checked })} />
                Recommend for promotion
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem" }}>
                <input type="checkbox" checked={form.bonusRecommended} onChange={(e) => setForm({ ...form, bonusRecommended: e.target.checked })} />
                Recommend for bonus
              </label>
            </div>
            {form.bonusRecommended && (
              <div className="form-group">
                <label className="form-label">Bonus Notes</label>
                <textarea
                  title="Bonus Notes"
                  className="form-textarea" value={form.bonusNotes} onChange={(e) => setForm({ ...form, bonusNotes: e.target.value })} />
              </div>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}