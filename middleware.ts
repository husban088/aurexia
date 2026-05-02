import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ✅ SIMPLE MIDDLEWARE — Koi server-side auth check nahi
// Kyun? supabase.ts mein storageKey:"sb-auth-token" set hai
// jo session ko localStorage mein store karta hai, cookies mein nahi.
// Middleware sirf cookies access kar sakta hai — localStorage nahi.
// Isliye yahan check karna HAMESHA fail hoga aur signin redirect hoga.
// Auth guard layout.tsx (client-side) handle karta hai — woh perfectly kaam karta hai.

export async function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/panel"],
};
