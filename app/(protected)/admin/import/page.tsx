"use client";

import { useState } from "react";
import Link from "next/link";
import BulkImportUploader from "@/components/BulkImportUploader";

export default function BulkImportPage() {
  const [tab, setTab] = useState<"employees" | "kpis">("employees");

  return (
    <div>
      <Link href="/admin" style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}>← Back to Admin</Link>

      <div className="page-header" style={{ marginTop: 12 }}>
        <div>
          <h1>Bulk Import</h1>
          <p style={{ color: "var(--color-neutral-500)", marginTop: 4 }}>Upload a spreadsheet to create many employees or KPIs at once.</p>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn${tab === "employees" ? " active" : ""}`} onClick={() => setTab("employees")}>Employees</button>
        <button className={`tab-btn${tab === "kpis" ? " active" : ""}`} onClick={() => setTab("kpis")}>KPIs</button>
      </div>

      <div className="card">
        <div className="card-body">
          <BulkImportUploader type={tab} />
        </div>
      </div>
    </div>
  );
}