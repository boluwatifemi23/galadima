"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import RatingBadge from "@/components/RatingBadge";
import PerformanceBar from "@/components/PerformanceBar";
import EmptyState from "@/components/EmptyState";
import { formatDate } from "@/lib/constants";

const WEIGHTED_LABELS = [
  { key: "kpiScore", label: "KPI Performance", weight: 60 },
  { key: "attendanceScore", label: "Attendance", weight: 10 },
  { key: "complianceScore", label: "Compliance", weight: 10 },
  { key: "managerReviewScore", label: "Manager Review", weight: 10 },
  { key: "peerReviewScore", label: "Peer Review", weight: 10 },
];

export default function AppraisalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [appraisal, setAppraisal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/appraisals/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          toast.error(json.error || "Could not load appraisal");
          return;
        }
        setAppraisal(json.appraisal);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><span className="spinner" /></div>;
  if (!appraisal) return <EmptyState title="Appraisal not found" text="It may have been deleted." />;

  return (
    <div>
      <Link href="/appraisals" style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}>← Back to Appraisals</Link>

      <div className="page-header" style={{ marginTop: 12 }}>
        <div>
          <h1>{appraisal.employee.name}</h1>
          <p style={{ color: "var(--color-neutral-500)", marginTop: 4 }}>{formatDate(appraisal.periodStart)} – {formatDate(appraisal.periodEnd)}</p>
        </div>
        <RatingBadge rating={appraisal.rating} />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <p className="stat-label">Overall Score</p>
          <p className="stat-value" style={{ fontSize: "2.5rem" }}>{appraisal.totalScore}%</p>
          <div style={{ marginTop: 10 }}><PerformanceBar score={appraisal.totalScore} /></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3>Breakdown</h3></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Component</th><th>Weight</th><th>Score</th><th>Contribution</th></tr></thead>
            <tbody>
              {WEIGHTED_LABELS.map((w) => (
                <tr key={w.key}>
                  <td>{w.label}</td>
                  <td>{w.weight}%</td>
                  <td>{appraisal[w.key]}%</td>
                  <td>{Math.round(((appraisal[w.key] * w.weight) / 100) * 100) / 100}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(appraisal.managerNotes || appraisal.promotionRecommended || appraisal.bonusRecommended) && (
        <div className="card">
          <div className="card-header"><h3>Recommendations</h3></div>
          <div className="card-body">
            {appraisal.managerNotes && <p style={{ fontSize: "0.875rem", marginBottom: 10 }}>{appraisal.managerNotes}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              {appraisal.promotionRecommended && <span className="badge badge-approved">Promotion Recommended</span>}
              {appraisal.bonusRecommended && <span className="badge badge-approved">Bonus Recommended</span>}
            </div>
            {appraisal.bonusNotes && <p style={{ fontSize: "0.8125rem", color: "var(--color-neutral-500)", marginTop: 10 }}>{appraisal.bonusNotes}</p>}
          </div>
        </div>
      )}
    </div>
  );
}