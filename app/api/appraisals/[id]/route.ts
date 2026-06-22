import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Appraisal from "@/lib/models/Appraisal";
import { requireAuth, requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";
import { calculateAppraisalScore } from "@/lib/calculator";
import type { DepartmentName } from "@/lib/types";

// Define interface for populated employee
interface PopulatedEmployee {
  _id: string;
  name: string;
  employeeId: string;
  department: DepartmentName;
}

interface PopulatedCreator {
  _id: string;
  name: string;
}

interface AppraisalDocument {
  _id: string;
  employee: PopulatedEmployee;
  createdBy: PopulatedCreator;
  kpiScore: number;
  attendanceScore: number;
  complianceScore: number;
  managerReviewScore: number;
  peerReviewScore: number;
  managerNotes?: string;
  promotionRecommended?: boolean;
  bonusRecommended?: boolean;
  bonusNotes?: string;
  totalScore: number;
  rating: string;
  save(): Promise<void>;
}

// Helper to safely get department from appraisal
function getEmployeeDepartment(appraisal: AppraisalDocument): DepartmentName {
  return appraisal.employee.department;
}

// Helper to safely update appraisal fields
function updateAppraisalFields(
  appraisal: AppraisalDocument,
  updates: Record<string, unknown>,
  allowedFields: string[]
): void {
  for (const field of allowedFields) {
    if (field in updates) {
      (appraisal[field as keyof AppraisalDocument] as unknown) = updates[field];
    }
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  await connectDB();

  const appraisal = (await Appraisal.findById(id)
    .populate("employee", "name employeeId department")
    .populate("createdBy", "name")) as AppraisalDocument | null;

  if (!appraisal) {
    return NextResponse.json(
      { success: false, error: "Appraisal not found" },
      { status: 404 }
    );
  }

  const isOwner = appraisal.employee._id.toString() === user!._id.toString();
  const isOwnDeptHead =
    user!.role === "department_head" &&
    getEmployeeDepartment(appraisal) === user!.department;
  const isPrivileged = ["super_admin", "hr_admin"].includes(user!.role);

  if (!isOwner && !isOwnDeptHead && !isPrivileged) {
    return NextResponse.json(
      { success: false, error: "Not authorized to view this appraisal" },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, appraisal });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireRole([
    "super_admin",
    "hr_admin",
    "department_head",
  ]);
  if (error) return error;

  const { id } = await params;
  await connectDB();

  const appraisal = (await Appraisal.findById(id).populate(
    "employee",
    "department"
  )) as AppraisalDocument | null;

  if (!appraisal) {
    return NextResponse.json(
      { success: false, error: "Appraisal not found" },
      { status: 404 }
    );
  }

  if (
    user!.role === "department_head" &&
    getEmployeeDepartment(appraisal) !== user!.department
  ) {
    return NextResponse.json(
      { success: false, error: "Not authorized to edit this appraisal" },
      { status: 403 }
    );
  }

  const updates = (await req.json()) as Record<string, unknown>;
  const allowedFields = [
    "attendanceScore",
    "complianceScore",
    "managerReviewScore",
    "peerReviewScore",
    "managerNotes",
    "promotionRecommended",
    "bonusRecommended",
    "bonusNotes",
  ];

  updateAppraisalFields(appraisal, updates, allowedFields);

  const result = calculateAppraisalScore({
    kpiScore: appraisal.kpiScore,
    attendanceScore: appraisal.attendanceScore,
    complianceScore: appraisal.complianceScore,
    managerReviewScore: appraisal.managerReviewScore,
    peerReviewScore: appraisal.peerReviewScore,
  });

  appraisal.totalScore = result.totalScore;
  appraisal.rating = result.rating;
  await appraisal.save();

  await createAuditLog({
    userId: user!._id.toString(),
    category: "appraisal",
    action: "appraisal_updated",
    resourceType: "Appraisal",
    resourceId: id,
    newValue: {
      totalScore: appraisal.totalScore,
      rating: appraisal.rating,
    },
  });

  return NextResponse.json({ success: true, appraisal });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireRole(["super_admin"]);
  if (error) return error;

  const { id } = await params;
  await connectDB();

  const appraisal = await Appraisal.findByIdAndDelete(id);

  if (!appraisal) {
    return NextResponse.json(
      { success: false, error: "Appraisal not found" },
      { status: 404 }
    );
  }

  await createAuditLog({
    userId: user!._id.toString(),
    category: "appraisal",
    action: "appraisal_deleted",
    resourceType: "Appraisal",
    resourceId: id,
  });

  return NextResponse.json({ success: true, message: "Appraisal deleted" });
}