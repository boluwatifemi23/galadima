import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import KPI from "@/lib/models/KPI";
import User from "@/lib/models/User";
import { requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";
import { getKPIPeriod } from "@/lib/calculator";

export async function POST(req: NextRequest) {
 const { user, error } = await requireRole(["super_admin", "department_head"]);
  if (error) return error;

  const { rows } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ success: false, error: "No rows provided" }, { status: 400 });
  }

  await connectDB();

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const employee = await User.findOne({ email: row.employeeEmail, isActive: true });
      if (!employee) {
        skipped += 1;
        errors.push(`Row ${row.rowIndex}: no active employee found with email ${row.employeeEmail}`);
        continue;
      }
      if (user!.role === "department_head" && employee.department !== user!.department) {
        skipped += 1;
        errors.push(`Row ${row.rowIndex}: ${row.employeeEmail} is outside your department, skipped`);
        continue;
      }

      const period = getKPIPeriod(row.kpiType);
      await KPI.create({
        name: row.name,
        description: row.description,
        department: employee.department,
        employee: employee._id,
        assignedBy: user!._id,
        category: row.category,
        formula: row.formula,
        kpiType: row.kpiType,
        weight: row.weight,
        targetValue: row.targetValue,
        evidenceRequired: row.evidenceRequired,
        dueDate: row.dueDate ? new Date(row.dueDate) : period.end,
        periodStart: period.start,
        periodEnd: period.end,
        status: "pending",
      });
      created += 1;
    } catch (err) {
      skipped += 1;
      errors.push(`Row ${row.rowIndex}: ${err instanceof Error ? err.message : "could not create KPI"}`);
    }
  }

  await createAuditLog({
    userId: user!._id.toString(),
    category: "kpi",
    action: "bulk_import_kpis",
    resourceType: "KPI",
    metadata: { created, skipped, totalRows: rows.length },
  });

  return NextResponse.json({ success: true, result: { created, updated: 0, skipped, errors } });
}