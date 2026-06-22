import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { hashPassword } from "@/lib/auth";
import { requireRole } from "@/lib/authorize";
import { createAuditLog } from "@/lib/audit";
import { generateTemporaryPassword } from "@/lib/constants";

type UserRole = "super_admin" | "department_head" | "staff" | "hr_admin";

const VALID_ROLES: ReadonlyArray<UserRole> = [
  "super_admin",
  "department_head",
  "staff",
  "hr_admin",
];

interface BulkImportRow {
  rowIndex: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
}

interface NewAccount {
  name: string;
  email: string;
  temporaryPassword: string;
}

interface BulkImportResult {
  success: boolean;
  result: {
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
    newAccounts: NewAccount[];
  };
}

interface ErrorResponse {
  success: boolean;
  error: string;
}

function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.includes(role as UserRole);
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<BulkImportResult | ErrorResponse>> {
  const { user, error } = await requireRole(["super_admin", "hr_admin"]);
  if (error) return error as NextResponse<ErrorResponse>;

  const requestData = (await req.json()) as { rows: unknown };
  const rows = requestData.rows as BulkImportRow[];

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json<ErrorResponse>(
      { success: false, error: "No rows provided" },
      { status: 400 }
    );
  }

  await connectDB();

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];
  const newAccounts: NewAccount[] = [];

  for (const row of rows) {
    if (!row.name || !row.email || !row.role || !row.department) {
      skipped += 1;
      errors.push(`Row ${row.rowIndex}: missing required fields, skipped`);
      continue;
    }

    if (!isValidRole(row.role)) {
      skipped += 1;
      errors.push(
        `Row ${row.rowIndex}: invalid role "${row.role}". Must be one of: ${VALID_ROLES.join(", ")}`
      );
      continue;
    }

    try {
      const existing = await User.findOne({ email: row.email });

      if (existing) {
        existing.name = row.name;
        existing.phone = row.phone || existing.phone;
        existing.department = row.department;
        existing.role = row.role;
        await existing.save();
        updated += 1;
      } else {
        const employeeId = (await User.generateEmployeeId()) as string;
        const tempPassword = generateTemporaryPassword();
        const passwordHash = await hashPassword(tempPassword);

        await User.create({
          employeeId,
          name: row.name,
          email: row.email,
          phone: row.phone,
          role: row.role,
          department: row.department,
          passwordHash,
          isActive: true,
        });

        created += 1;
        newAccounts.push({
          name: row.name,
          email: row.email,
          temporaryPassword: tempPassword,
        });
      }
    } catch (err) {
      skipped += 1;
      const errorMessage =
        err instanceof Error ? err.message : "could not save";
      errors.push(
        `Row ${row.rowIndex} (${row.email}): ${errorMessage}`
      );
    }
  }

  await createAuditLog({
    userId: user!._id.toString(),
    category: "user",
    action: "bulk_import_employees",
    resourceType: "User",
    metadata: { created, updated, skipped, totalRows: rows.length },
  });

  return NextResponse.json<BulkImportResult>({
    success: true,
    result: { created, updated, skipped, errors, newAccounts },
  });
}