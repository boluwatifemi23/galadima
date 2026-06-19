/**
 * Creates the one and only account that gets to sign itself up: the super
 * admin. Every other account gets created BY a logged-in super admin
 * through the app — there is no public sign-up page, on purpose.
 *
 * Run once: npm run seed
 * Safe to run again — it won't duplicate the account if it already exists.
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../lib/models/User";

const SUPER_ADMIN = {
  employeeId: "EMP-0001",
  name: "Gloria Aguedu",
  email: "gloria.a@landbookbyharmony.com",
  phone: "",
  role: "super_admin" as const,
  department: "Administration",
  password: "ChangeThisPassword123!", // change this, then change it again after first login
};

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is missing from your .env.local file");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ email: SUPER_ADMIN.email });
  if (existing) {
    console.log(`Account for ${SUPER_ADMIN.email} already exists — nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(SUPER_ADMIN.password, 10);

  await User.create({
    employeeId: SUPER_ADMIN.employeeId,
    name: SUPER_ADMIN.name,
    email: SUPER_ADMIN.email,
    phone: SUPER_ADMIN.phone,
    role: SUPER_ADMIN.role,
    department: SUPER_ADMIN.department,
    passwordHash,
    isActive: true,
  });

  console.log(`\nSuper admin created:`);
  console.log(`  Email:    ${SUPER_ADMIN.email}`);
  console.log(`  Password: ${SUPER_ADMIN.password}`);
  console.log(`\nSign in, then change this password right away.\n`);

  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});