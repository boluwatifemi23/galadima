import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import KPI from "@/lib/models/KPI";
import { requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";
import { getKPIPeriod } from "@/lib/calculator";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(["super_admin", "department_head"]);
  if (error) return error;

  const { id } = await params;
  const { employeeId } = await req.json().catch(() => ({ employeeId: undefined }));

  await connectDB();
  const source = await KPI.findById(id);
  if (!source) return NextResponse.json({ success: false, error: "KPI not found" }, { status: 404 });

  if (user!.role === "department_head" && source.department !== user!.department) {
    return NextResponse.json({ success: false, error: "Not authorized to clone this KPI" }, { status: 403 });
  }

  const period = getKPIPeriod(source.kpiType);
  const clone = await KPI.create({
    name: source.name,
    description: source.description,
    department: source.department,
    employee: employeeId || source.employee,
    assignedBy: user!._id,
    template: source.template,
    category: source.category,
    formula: source.formula,
    kpiType: source.kpiType,
    weight: source.weight,
    targetValue: source.targetValue,
    evidenceRequired: source.evidenceRequired,
    dueDate: period.end,
    periodStart: period.start,
    periodEnd: period.end,
    status: "pending",
  });

  await createAuditLog({ userId: user!._id.toString(), category: "kpi", action: "kpi_cloned", resourceType: "KPI", resourceId: clone._id.toString(), metadata: { sourceKpiId: id } });

  return NextResponse.json({ success: true, kpi: clone }, { status: 201 });
}