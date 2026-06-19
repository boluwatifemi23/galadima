import mongoose, { Schema, Document, Model } from "mongoose";

// The four roles we agreed on. department_head covers what used to be
// "team lead" and "manager" too — one tier, not three.
export type UserRole = "super_admin" | "department_head" | "staff" | "hr_admin";

export interface IUser extends Document {
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never send this back in a query result by default
    },
    role: {
      type: String,
      enum: ["super_admin", "department_head", "staff", "hr_admin"],
      required: true,
    },
    department: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Mongoose re-uses the model if it's already compiled — stops Next.js's
// hot-reload from throwing "model already exists" errors.
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;