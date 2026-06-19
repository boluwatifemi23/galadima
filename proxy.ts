import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// Next.js 16 renamed "middleware.ts" to "proxy.ts" — same job, same
// matcher config. It now runs on the full Node.js runtime by default,
// which is exactly what jsonwebtoken needs, so there's nothing extra to
// configure here.
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};

const COOKIE_NAME = "galadima_token";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? verifyToken(token) : null;
  const isOnLoginPage = request.nextUrl.pathname === "/login";

  if (!session && !isOnLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isOnLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}