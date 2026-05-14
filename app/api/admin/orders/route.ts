// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendStatusUpdateEmail } from "@/lib/email";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
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
      console.error("[API/orders] Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ orders: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/orders — status + shipping details update + auto email
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      status,
      courier_name,
      courier_country,
      estimated_days,
      tracking_number,
      courier_tracking_url,
      shipped_at,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 },
      );
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) updatePayload.status = status;
    if (courier_name !== undefined) updatePayload.courier_name = courier_name;
    if (courier_country !== undefined)
      updatePayload.courier_country = courier_country;
    if (estimated_days !== undefined)
      updatePayload.estimated_days = estimated_days;
    if (tracking_number !== undefined)
      updatePayload.tracking_number = tracking_number;
    if (courier_tracking_url !== undefined)
      updatePayload.courier_tracking_url = courier_tracking_url;
    if (shipped_at !== undefined) {
      updatePayload.shipped_at =
        shipped_at === "now" ? new Date().toISOString() : shipped_at;
    }

    if (Object.keys(updatePayload).length === 1) {
      return NextResponse.json(
        { error: "At least one field to update is required" },
        { status: 400 },
      );
    }

    const supabase = getClient();

    // ─── Get order details BEFORE update (for email) ───────────────────────
    const { data: orderData } = await supabase
      .from("orders")
      .select(
        "email, first_name, last_name, order_number, status, tracking_number, courier_name, courier_tracking_url, estimated_days",
      )
      .eq("id", orderId)
      .single();

    // ─── Update the order ──────────────────────────────────────────────────
    const { error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (error) {
      console.error("[API/orders PATCH] Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ─── Send status update email to customer ──────────────────────────────
    // Only send email if status actually changed to a notifiable status
    const notifiableStatuses = [
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (status && notifiableStatuses.includes(status) && orderData?.email) {
      const customerName =
        `${orderData.first_name || ""} ${orderData.last_name || ""}`.trim() ||
        "Customer";

      // Use new values if provided, fallback to existing order values
      const finalTrackingNumber = tracking_number ?? orderData.tracking_number;
      const finalCourierName = courier_name ?? orderData.courier_name;
      const finalCourierUrl =
        courier_tracking_url ?? orderData.courier_tracking_url;
      const finalEstimatedDays = estimated_days ?? orderData.estimated_days;

      // Fire and forget — don't block the response
      sendStatusUpdateEmail(
        orderData.email,
        customerName,
        orderData.order_number,
        status as
          | "shipped"
          | "delivered"
          | "cancelled"
          | "confirmed"
          | "processing",
        finalTrackingNumber,
        finalCourierName,
        finalCourierUrl,
        finalEstimatedDays,
      )
        .then((sent) => {
          console.log(
            `📧 Status email (${status}) to ${orderData.email}: ${sent ? "✅ sent" : "❌ failed"}`,
          );
        })
        .catch((err) => {
          console.error("📧 Status email error:", err);
        });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[API/orders PATCH] Exception:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
