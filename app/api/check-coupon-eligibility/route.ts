// app/api/check-coupon-eligibility/route.ts
// ✅ Returns eligible=true if:
//    (1) email matches OWNER_EMAIL env variable (owner bypass)
//    (2) OR email exists in delivered_customers table
// ✅ Uses service role key — secure, not exposed to client
// ✅ Email comparison is case-insensitive

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { eligible: false, message: "Email is required." },
        { status: 400 },
      );
    }

    const emailLower = email.trim().toLowerCase();

    // ── 1. Owner check ────────────────────────────────────────────────────────
    // Set OWNER_EMAIL in your .env.local (e.g. OWNER_EMAIL=you@gmail.com)
    const ownerEmail = (process.env.OWNER_EMAIL || "").trim().toLowerCase();

    if (ownerEmail && emailLower === ownerEmail) {
      console.log(`✅ Coupon eligibility: OWNER bypass for ${emailLower}`);
      return NextResponse.json({
        eligible: true,
        reason: "owner",
        message: "Owner access granted.",
      });
    }

    // ── 2. Delivered customer check ───────────────────────────────────────────
    const supabase = getClient();

    const { data, error } = await supabase
      .from("delivered_customers")
      .select("id, order_number, delivered_at")
      .ilike("email", emailLower) // case-insensitive match
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("❌ Eligibility DB error:", error.message);
      return NextResponse.json(
        {
          eligible: false,
          message: "Could not verify eligibility. Please try again.",
        },
        { status: 500 },
      );
    }

    if (data) {
      console.log(
        `✅ Coupon eligibility: delivered customer ${emailLower} | order ${data.order_number}`,
      );
      return NextResponse.json({
        eligible: true,
        reason: "delivered_customer",
        orderNumber: data.order_number,
        deliveredAt: data.delivered_at,
      });
    }

    // ── Not eligible ──────────────────────────────────────────────────────────
    console.log(`❌ Coupon eligibility: NOT eligible — ${emailLower}`);
    return NextResponse.json({
      eligible: false,
      message:
        "This coupon is only available for customers whose order has been delivered.",
    });
  } catch (err: any) {
    console.error("❌ check-coupon-eligibility crash:", err?.message || err);
    return NextResponse.json(
      { eligible: false, message: "Server error. Please try again." },
      { status: 500 },
    );
  }
}
