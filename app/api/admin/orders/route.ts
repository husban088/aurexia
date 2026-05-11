// app/api/admin/orders/route.ts
// ✅ Anon key se kaam karta hai — service_role ki zaroorat nahi
// ✅ PATCH mein shipping fields (courier_name, courier_country, estimated_days, rider_number, shipped_at) support added

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// GET /api/admin/orders
export async function GET(_req: NextRequest) {
  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API/orders] Error:", error.message, "code:", error.code);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 },
      );
    }

    return NextResponse.json({ orders: data ?? [] });
  } catch (err: any) {
    console.error("[API/orders] Exception:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/orders — status + shipping details update
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      status,
      // ✅ Naye shipping fields
      courier_name,
      courier_country,
      estimated_days,
      rider_number,
      shipped_at,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 },
      );
    }

    // ✅ Sirf woh fields update karo jo request mein aayi hain
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) updatePayload.status = status;
    if (courier_name !== undefined) updatePayload.courier_name = courier_name;
    if (courier_country !== undefined) updatePayload.courier_country = courier_country;
    if (estimated_days !== undefined) updatePayload.estimated_days = estimated_days;
    if (rider_number !== undefined) updatePayload.rider_number = rider_number;

    // shipped_at: agar "now" string aaye toh current time use karo
    if (shipped_at !== undefined) {
      updatePayload.shipped_at =
        shipped_at === "now" ? new Date().toISOString() : shipped_at;
    }

    // Agar sirf orderId aaya aur koi field nahi — error
    if (Object.keys(updatePayload).length === 1) {
      return NextResponse.json(
        { error: "At least one field to update is required" },
        { status: 400 },
      );
    }

    const supabase = getClient();

    const { error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (error) {
      console.error("[API/orders PATCH] Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[API/orders PATCH] Exception:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}