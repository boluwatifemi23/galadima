import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import KPI from "@/lib/models/KPI";
import { requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(["super_admin", "department_head"]);
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const kpi = await KPI.findById(id);
  if (!kpi) return NextResponse.json({ success: false, error: "KPI not found" }, { status: 404 });

  if (user!.role === "department_head" && kpi.department !== user!.department) {
    return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
  }

  kpi.isArchived = !kpi.isArchived;
  await kpi.save();

  await createAuditLog({ userId: user!._id.toString(), category: "kpi", action: kpi.isArchived ? "kpi_archived" : "kpi_unarchived", resourceType: "KPI", resourceId: id });

  return NextResponse.json({ success: true, kpi });
}