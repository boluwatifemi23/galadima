import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Not logged in" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      employeeId: user.employeeId,
      phone: user.phone,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Not logged in" }, { status: 401 });
  }

  const { name, phone } = await req.json();
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  await user.save();

  return NextResponse.json({
    success: true,
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role, department: user.department, employeeId: user.employeeId, phone: user.phone },
  });
}