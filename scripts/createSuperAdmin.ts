import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { hashPassword } from "@/lib/auth";

async function run() {
  const name = process.env.SUPER_ADMIN_NAME;
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const department = process.env.SUPER_ADMIN_DEPARTMENT || "Administration";

  if (!name || !email || !password) {
    console.error("Missing required env vars. Run like this:\n");
    console.error('SUPER_ADMIN_NAME="Your Name" SUPER_ADMIN_EMAIL="you@landbookbyharmony.com" SUPER_ADMIN_PASSWORD="a-strong-real-password" npx tsx scripts/createSuperAdmin.ts');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    console.log(`An account already exists for ${email} (${existing.employeeId}, role: ${existing.role}).`);
    console.log("Nothing was changed — delete that account first if you want to recreate it, or use a different email.");
    await mongoose.disconnect();
    return;
  }

  const employeeId = await (User as typeof User & { generateEmployeeId(): Promise<string> }).generateEmployeeId();
  const passwordHash = await hashPassword(password);

  await User.create({
    employeeId,
    name,
    email: email.toLowerCase().trim(),
    role: "super_admin",
    department,
    passwordHash,
    isActive: true,
  });

  console.log(`Super Admin created: ${name} (${employeeId})`);
  console.log(`Email: ${email}`);
  console.log("You can log in with that email and the password you set now.");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});