import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSystemSettings } from "@/lib/models/SystemSettings";
import { requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const { error } = await requireRole(["super_admin"]);
  if (error) return error;

  await connectDB();
  const settings = await getSystemSettings();
  return NextResponse.json({ success: true, reportRecipientEmails: settings.reportRecipientEmails });
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireRole(["super_admin"]);
  if (error) return error;

  const { reportRecipientEmails } = await req.json();
  if (!Array.isArray(reportRecipientEmails)) {
    return NextResponse.json({ success: false, error: "reportRecipientEmails must be an array" }, { status: 400 });
  }

  await connectDB();
  const settings = await getSystemSettings();
  settings.reportRecipientEmails = reportRecipientEmails;
  await settings.save();

  await createAuditLog({
    userId: user!._id.toString(),
    category: "report",
    action: "report_recipients_updated",
    resourceType: "SystemSettings",
    newValue: { reportRecipientEmails },
  });

  return NextResponse.json({ success: true, reportRecipientEmails });
}