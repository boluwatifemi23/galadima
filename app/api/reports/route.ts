import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Report from "@/lib/models/Report";
import { requireRole } from "@/lib/authorize";

export async function GET() {
  const { error } = await requireRole(["super_admin", "hr_admin"]);
  if (error) return error;

  await connectDB();
  const reports = await Report.find().sort({ createdAt: -1 }).limit(50).populate("generatedBy", "name");
  return NextResponse.json({ success: true, reports });
}