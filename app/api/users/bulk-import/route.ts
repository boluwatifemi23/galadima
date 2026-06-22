import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { hashPassword } from "@/lib/auth";
import { requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";
import { generateTemporaryPassword } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const { user, error } = await requireRole(["super_admin", "hr_admin"]);
  if (error) return error;

  const { rows } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ success: false, error: "No rows provided" }, { status: 400 });
  }

  await connectDB();

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];
  const newAccounts: { name: string; email: string; temporaryPassword: string }[] = [];

  for (const row of rows) {
    if (!row.name || !row.email || !row.role || !row.department) {
      skipped += 1;
      errors.push(`Row ${row.rowIndex}: missing required fields, skipped`);
      continue;
    }

    try {
      const existing = await User.findOne({ email: row.email });
      if (existing) {
        existing.name = row.name;
        existing.phone = row.phone || existing.phone;
        existing.department = row.department;
        await existing.save();
        updated += 1;
      } else {
        const employeeId = await (User as any).generateEmployeeId();
        const tempPassword = generateTemporaryPassword();
        const passwordHash = await hashPassword(tempPassword);
        await User.create({ employeeId, name: row.name, email: row.email, phone: row.phone, role: row.role, department: row.department, passwordHash, isActive: true });
        created += 1;
        newAccounts.push({ name: row.name, email: row.email, temporaryPassword: tempPassword });
      }
    } catch (err: any) {
      skipped += 1;
      errors.push(`Row ${row.rowIndex} (${row.email}): ${err.message || "could not save"}`);
    }
  }

  await createAuditLog({
    userId: user!._id.toString(),
    category: "user",
    action: "bulk_import_employees",
    resourceType: "User",
    metadata: { created, updated, skipped, totalRows: rows.length },
  });

  return NextResponse.json({ success: true, result: { created, updated, skipped, errors, newAccounts } });
}