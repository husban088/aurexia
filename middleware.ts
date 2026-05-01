import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const isPanelRoute = req.nextUrl.pathname.startsWith("/panel");

  if (isPanelRoute) {
    console.log("🔍 Middleware - Panel route accessed:", req.nextUrl.pathname);

    // TEMPORARILY ALLOW ALL ACCESS FOR DEBUGGING
    // Remove this after fixing the issue
    console.log("✅ Middleware - Allowing access (debug mode)");
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/panel"],
};
