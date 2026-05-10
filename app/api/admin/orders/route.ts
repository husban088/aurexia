// app/api/admin/orders/route.ts
// ✅ Anon key se kaam karta hai — service_role ki zaroorat nahi
// RLS "public_select" policy USING(true) hai toh anon bhi sab dekh sakta hai

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Service role use karo agar hai, warna anon key fallback
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

// PATCH /api/admin/orders — status update
export async function PATCH(req: NextRequest) {
  try {
    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "orderId and status required" },
        { status: 400 },
      );
    }

    const supabase = getClient();

    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
