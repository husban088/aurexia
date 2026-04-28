// 📁 File name: proxy.ts (was: middleware.ts)
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OWNER_EMAIL = "info@tech4ru.com";

export async function proxy(req: NextRequest) {
  // ← middleware se proxy mein change kiya
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

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
      // ✅ Use getUser() instead of getSession()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      // If no user or error, redirect to signin
      if (error || !user) {
        const redirectUrl = new URL("/signin", req.url);
        redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Check if user is owner (case-insensitive)
      const userEmail = user.email?.trim().toLowerCase();
      const ownerEmail = OWNER_EMAIL.toLowerCase();

      if (userEmail !== ownerEmail) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (err) {
      console.error("Middleware auth error:", err);
      const redirectUrl = new URL("/signin", req.url);
      redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/panel/:path*", "/panel"],
};
