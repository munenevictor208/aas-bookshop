import { NextResponse, type NextRequest } from "next/server";
import {
  getAuthConfig,
  isAdminPath,
  isPublicAdminPath,
  SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAdminPath(pathname) || isPublicAdminPath(pathname)) {
    return NextResponse.next();
  }

  const config = getAuthConfig();
  const token = config
    ? request.cookies.get(SESSION_COOKIE)?.value
    : undefined;
  const session = config ? verifySessionToken(token, config.secret) : null;

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
