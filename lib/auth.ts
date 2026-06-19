import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import User, { UserRole } from "@/lib/models/User";


const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "galadima_token";
const TOKEN_LIFETIME = "7d";

// ─── Passwords ──────────────────────────────────────────────────────────────

export async function hashPassword(plainPassword: string) {
  return bcrypt.hash(plainPassword, 10);
}

export async function verifyPassword(plainPassword: string, passwordHash: string) {
  return bcrypt.compare(plainPassword, passwordHash);
}

// ─── JWT ────────────────────────────────────────────────────────────────────

// What we store inside the token — kept small on purpose. Anything else
// about the user (department, etc.) is looked up fresh from the database
// when needed, so it's never stale.
export interface TokenPayload {
  userId: string;
  role: UserRole;
  name: string;
  employeeId: string;
}

export function signToken(payload: TokenPayload) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is missing from your .env.local file");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_LIFETIME });
}

export function verifyToken(token: string): TokenPayload | null {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is missing from your .env.local file");
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    // Expired or tampered token — treat exactly like "not logged in".
    return null;
  }
}

// ─── Cookie helpers ─────────────────────────────────────────────────────────

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days, matches TOKEN_LIFETIME above
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

// ─── The one function most pages/API routes will actually use ─────────────

/**
 * Reads the cookie, verifies the JWT, and loads the full user record from
 * the database (so isActive / role / department are always current).
 * Returns null if there's no valid session — callers decide what to do
 * about that (redirect, 401, etc.).
 */
export async function getCurrentUser() {
  const token = await getTokenFromCookie();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  await connectDB();
  const user = await User.findById(payload.userId);

  if (!user || !user.isActive) return null;

  return user;
}