import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const OWNER_EMAIL = "info@tech4ru.com";

export async function middleware(req: NextRequest) {
  const isPanelRoute = req.nextUrl.pathname.startsWith("/panel");

  if (!isPanelRoute) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  try {
    // Create a Supabase server client using cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value);
              res.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Get session from cookies (fast — no network round trip)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      // No session — redirect to signin
      const signinUrl = new URL("/signin", req.url);
      signinUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
      return NextResponse.redirect(signinUrl);
    }

    const userEmail = session.user?.email?.trim().toLowerCase() || "";
    const ownerEmail = OWNER_EMAIL.toLowerCase();

    if (userEmail !== ownerEmail) {
      // Logged in but not the owner — redirect home
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Owner confirmed — allow through
    return res;
  } catch (err) {
    console.error("Middleware error:", err);
    // On error, redirect to signin for safety
    const signinUrl = new URL("/signin", req.url);
    signinUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
    return NextResponse.redirect(signinUrl);
  }
}

export const config = {
  matcher: ["/panel", "/panel/:path*"],
};
