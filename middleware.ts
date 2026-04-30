// 📁 File name: middleware.ts  ← ROOT of your project (same level as package.json)
// ⚠️ IMPORTANT: This file MUST be named "middleware.ts" and placed at project ROOT
// NOT inside /app or /pages folder

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OWNER_EMAIL = "info@tech4ru.com";

// ✅ MUST be named "middleware" — Next.js only recognizes this exact name
export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // ✅ Create Supabase server client — this properly handles session cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const isPanelRoute = req.nextUrl.pathname.startsWith("/panel");

  if (isPanelRoute) {
    try {
      // ✅ getUser() is more secure than getSession()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      // No user or error → redirect to signin
      if (error || !user) {
        const redirectUrl = new URL("/signin", req.url);
        redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Only owner email allowed
      const userEmail = user.email?.trim().toLowerCase();
      const ownerEmail = OWNER_EMAIL.toLowerCase();

      if (userEmail !== ownerEmail) {
        return NextResponse.redirect(new URL("/", req.url));
      }

      // ✅ User is authenticated & authorized — allow through
      // response already has refreshed session cookies set above
    } catch (err) {
      console.error("Middleware auth error:", err);
      const redirectUrl = new URL("/signin", req.url);
      redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

// ✅ Matcher config stays the same
export const config = {
  matcher: ["/panel/:path*", "/panel"],
};
