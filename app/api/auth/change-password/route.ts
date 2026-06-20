import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ success: false, error: "Not logged in" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ success: false, error: "Both current and new password are required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ success: false, error: "New password must be at least 8 characters" }, { status: 400 });
  }

  await connectDB();
  // passwordHash is select:false on the schema — reload it explicitly here.
  const user = await User.findById(currentUser._id).select("+passwordHash");
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const matches = await verifyPassword(currentPassword, user.passwordHash);
  if (!matches) {
    return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 401 });
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  await createAuditLog({
    userId: user._id.toString(),
    category: "auth",
    action: "password_changed",
    resourceType: "User",
    resourceId: user._id.toString(),
  });

  return NextResponse.json({ success: true, message: "Password updated" });
}