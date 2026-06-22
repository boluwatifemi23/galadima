import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Department from "@/lib/models/Department";
import { hashPassword } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

async function seed() {
  await connectDB();

  const departments = ["Technology", "Sales", "Construction", "Finance", "Support"];
  
  for (const name of departments) {
    await Department.findOneAndUpdate({ name }, { name }, { upsert: true });
  }
  
  console.log(`Seeded ${departments.length} departments`);

  const people: Array<{
    name: string;
    email: string;
    role: UserRole;
    department: string;
  }> = [
    { name: "Super Admin", email: "admin@harmonygarden.com", role: "super_admin", department: "Technology" },
    { name: "Jane HR", email: "hr@harmonygarden.com", role: "hr_admin", department: "Technology" },
    { name: "Sam Sales Head", email: "sales.head@harmonygarden.com", role: "department_head", department: "Sales" },
    { name: "Alex Staff", email: "alex@harmonygarden.com", role: "staff", department: "Sales" },
  ];

  for (const p of people) {
    if (await User.findOne({ email: p.email })) {
      console.log(`Skipping ${p.email} — already exists`);
      continue;
    }
    
    const employeeId = await User.generateEmployeeId();
    const passwordHash = await hashPassword("Password123!");
    
    await User.create({
      name: p.name,
      email: p.email,
      role: p.role,
      department: p.department,
      employeeId,
      passwordHash,
      isActive: true,
    });
    
    console.log(`Created ${p.email} (${employeeId}) — password: Password123!`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});