import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ✅ PERF FIX: Middleware caching strategy fixed
// Pehle: no-store har page pe = browser cache ZERO = har click pe full server roundtrip
// Yeh sabse bada reason tha slow navigation ka
//
// Naya approach:
// - HTML pages: no-cache (revalidate karo, lekin cached version use kar sakte hain)
// - bfcache: sirf pageshow(persisted) pe handle karo — providers.tsx mein already hai
// - Static assets: middleware se exclude hain already

export async function middleware(req: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = req.nextUrl;

  // ✅ Panel/admin pages — completely no-cache (sensitive data)
  if (pathname.startsWith("/panel") || pathname.startsWith("/admin")) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    return response;
  }

  // ✅ API routes — no-store (fresh data always)
  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  // ✅ PERF FIX: Regular pages — stale-while-revalidate
  // Browser cached version use karega (fast), background mein revalidate hoga
  // Pehle no-store tha = har navigation pe full reload = slow
  response.headers.set(
    "Cache-Control",
    "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
  );

  // ✅ Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js)$).*)",
  ],
};
