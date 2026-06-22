import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Appraisal from "@/lib/models/Appraisal";
import KPI from "@/lib/models/KPI";
import User from "@/lib/models/User";
import { requireAuth, requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";
import { calculateAppraisalScore } from "@/lib/calculator";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { FilterQuery } from "mongoose";
import type { Types } from "mongoose";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const employeeParam = searchParams.get("employee");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE));

  const query: FilterQuery<typeof Appraisal> = {};

  if (user!.role === "staff") {
    query.employee = user!._id;
  } else if (user!.role === "department_head") {
    const deptUsers = await User.find({ department: user!.department }).select("_id");
    const ids = deptUsers.map((u) => u._id);
    query.employee = { $in: ids };
  }

  if (employeeParam && user!.role !== "staff") {
    query.employee = employeeParam;
  }

  const skip = (page - 1) * limit;

  const [appraisals, total] = await Promise.all([
    Appraisal.find(query)
      .populate("employee", "name employeeId department")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Appraisal.countDocuments(query),
  ]);

  return NextResponse.json({
    success: true,
    appraisals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireRole(["super_admin", "hr_admin", "department_head"]);
  if (error) return error;

  try {
    const body = (await req.json()) as {
      employeeId?: string;
      periodStart?: string;
      periodEnd?: string;
      attendanceScore?: number | string;
      complianceScore?: number | string;
      managerReviewScore?: number | string;
      peerReviewScore?: number | string;
      managerNotes?: string;
      promotionRecommended?: boolean;
      bonusRecommended?: boolean;
      bonusNotes?: string;
    };

    const { employeeId, periodStart, periodEnd, managerNotes, bonusNotes } = body;

    if (!employeeId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: "employeeId, periodStart, and periodEnd are required" },
        { status: 400 }
      );
    }

    const attendanceScore = Number(body.attendanceScore ?? 0) || 0;
    const complianceScore = Number(body.complianceScore ?? 0) || 0;
    const managerReviewScore = Number(body.managerReviewScore ?? 0) || 0;
    const peerReviewScore = Number(body.peerReviewScore ?? 0) || 0;

    await connectDB();

    const employee = await User.findById(employeeId);
    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    if (user!.role === "department_head" && employee.department !== user!.department) {
      return NextResponse.json(
        { success: false, error: "You can only appraise employees in your own department" },
        { status: 403 }
      );
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const approvedKpis = await KPI.find({
      employee: employeeId,
      status: "approved",
      approvedAt: { $gte: start, $lte: end },
    });

    const kpiScore =
      approvedKpis.length > 0
        ? Math.round(
            approvedKpis.reduce((sum, k) => sum + (k.achievementPercent ?? 0), 0) /
              approvedKpis.length
          )
        : 0;

    const result = calculateAppraisalScore({
      kpiScore,
      attendanceScore,
      complianceScore,
      managerReviewScore,
      peerReviewScore,
    });

    const appraisal = await Appraisal.create({
      employee: employeeId,
      periodStart: start,
      periodEnd: end,
      kpiScore,
      attendanceScore,
      complianceScore,
      managerReviewScore,
      peerReviewScore,
      totalScore: result.totalScore,
      rating: result.rating,
      managerNotes,
      promotionRecommended: Boolean(body.promotionRecommended),
      bonusRecommended: Boolean(body.bonusRecommended),
      bonusNotes,
      createdBy: user!._id,
    });

    await createAuditLog({
      userId: user!._id.toString(),
      category: "appraisal",
      action: "appraisal_created",
      resourceType: "Appraisal",
      resourceId: (appraisal._id as Types.ObjectId).toString(),
      newValue: {
        employee: employee.name,
        totalScore: result.totalScore,
        rating: result.rating,
      },
    });

    return NextResponse.json({ success: true, appraisal }, { status: 201 });
  } catch (err: unknown) {
    // Handle duplicate key error (unique period per employee)
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { success: false, error: "An appraisal for this employee and period already exists" },
        { status: 409 }
      );
    }

    console.error("Appraisal create error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}