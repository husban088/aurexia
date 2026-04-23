// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OWNER_EMAIL = "info@tech4ru.com";

export async function middleware(req: NextRequest) {
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
    // ✅ Use getUser() instead of getSession()
    // getSession() reads from cookie only (can be stale/missing server-side)
    // getUser() makes a real request to Supabase to verify the token — always reliable
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log(
      "Panel route accessed, user:",
      user?.email ?? "none",
      "error:",
      error?.message ?? "none"
    );

    if (error || !user) {
      const redirectUrl = new URL("/signin", req.url);
      redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (user.email?.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/panel/:path*", "/panel"],
};
