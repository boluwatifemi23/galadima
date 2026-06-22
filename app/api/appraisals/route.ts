import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Appraisal from "@/lib/models/Appraisal";
import KPI from "@/lib/models/KPI";
import User from "@/lib/models/User";
import { requireAuth, requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";
import { calculateAppraisalScore } from "@/lib/calculator";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const employeeParam = searchParams.get("employee");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE));

  const query: Record<string, unknown> = {};

  if (user!.role === "staff") {
    query.employee = user!._id;
  } else if (user!.role === "department_head") {
    const deptUserIds = await User.find({ department: user!.department }).select("_id");
    query.employee = { $in: deptUserIds.map((u) => u._id) };
  }
  if (employeeParam && user!.role !== "staff") query.employee = employeeParam;

  const skip = (page - 1) * limit;
  const [appraisals, total] = await Promise.all([
    Appraisal.find(query).populate("employee", "name employeeId department").populate("createdBy", "name").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Appraisal.countDocuments(query),
  ]);

  return NextResponse.json({ success: true, appraisals, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireRole(["super_admin", "hr_admin", "department_head"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { employeeId, periodStart, periodEnd, attendanceScore, complianceScore, managerReviewScore, peerReviewScore, managerNotes, promotionRecommended, bonusRecommended, bonusNotes } = body;

    if (!employeeId || !periodStart || !periodEnd) {
      return NextResponse.json({ success: false, error: "employeeId, periodStart, and periodEnd are required" }, { status: 400 });
    }

    await connectDB();
    const employee = await User.findById(employeeId);
    if (!employee) return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });

    if (user!.role === "department_head" && employee.department !== user!.department) {
      return NextResponse.json({ success: false, error: "You can only appraise employees in your own department" }, { status: 403 });
    }

    const approvedKpis = await KPI.find({ employee: employeeId, status: "approved", approvedAt: { $gte: new Date(periodStart), $lte: new Date(periodEnd) } });
    const kpiScore = approvedKpis.length ? Math.round(approvedKpis.reduce((sum, k) => sum + (k.achievementPercent || 0), 0) / approvedKpis.length) : 0;

    const result = calculateAppraisalScore({
      kpiScore,
      attendanceScore: attendanceScore || 0,
      complianceScore: complianceScore || 0,
      managerReviewScore: managerReviewScore || 0,
      peerReviewScore: peerReviewScore || 0,
    });

    const appraisal = await Appraisal.create({
      employee: employeeId,
      periodStart,
      periodEnd,
      kpiScore,
      attendanceScore: attendanceScore || 0,
      complianceScore: complianceScore || 0,
      managerReviewScore: managerReviewScore || 0,
      peerReviewScore: peerReviewScore || 0,
      totalScore: result.totalScore,
      rating: result.rating,
      managerNotes,
      promotionRecommended: !!promotionRecommended,
      bonusRecommended: !!bonusRecommended,
      bonusNotes,
      createdBy: user!._id,
    });

    await createAuditLog({
      userId: user!._id.toString(),
      category: "appraisal",
      action: "appraisal_created",
      resourceType: "Appraisal",
      resourceId: appraisal._id.toString(),
      newValue: { employee: employee.name, totalScore: result.totalScore, rating: result.rating },
    });

    return NextResponse.json({ success: true, appraisal }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ success: false, error: "An appraisal for this employee and period already exists" }, { status: 409 });
    }
    console.error("Appraisal create error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}