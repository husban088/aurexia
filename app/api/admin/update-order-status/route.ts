// app/api/admin/update-order-status/route.ts
// ✅ All statuses: shipped, delivered, cancelled, confirmed, processing
// ✅ items field correctly passed (was orderItems before — now fixed)
// ✅ customerCountry passed to all emails for currency conversion
// ✅ No tracking link sent in email — only courier name + tracking number
// ✅ Anti-spam: no bulk headers → direct inbox

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import {
  sendStatusUpdateEmail,
  sendOwnerStatusAlert,
  sendOrderConfirmationEmail,
  sendOwnerOrderAlert,
} from "@/lib/email";

// ─── Supabase client ──────────────────────────────────────────────────────────
function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── WhatsApp templates ───────────────────────────────────────────────────────

function shippedWA(
  name: string,
  orderNumber: string,
  courierName: string,
  trackingNumber: string,
  estimatedDays: string,
): string {
  return `Order Shipped - Tech4U

Hello ${name}, your order is on its way.

Order: ${orderNumber}
Courier: ${courierName}
Tracking Number: ${trackingNumber}
Estimated Delivery: ${estimatedDays}

Questions: info@tech4ru.com`;
}

function deliveredWA(name: string, orderNumber: string): string {
  return `Order Delivered - Tech4U

Hello ${name},

Your order ${orderNumber} has been delivered.

Thank you for shopping with Tech4U.

Questions: info@tech4ru.com`;
}

function cancelledWA(name: string, orderNumber: string): string {
  return `Order Cancelled - Tech4U

Hello ${name},

Your order ${orderNumber} has been cancelled.

If you have any questions, please email us at info@tech4ru.com`;
}

function confirmedWA(name: string, orderNumber: string): string {
  return `Order Confirmed - Tech4U

Hello ${name},

Your order ${orderNumber} has been confirmed. We will notify you when it is processed.

Questions: info@tech4ru.com`;
}

function processingWA(name: string, orderNumber: string): string {
  return `Order Processing - Tech4U

Hello ${name},

Your order ${orderNumber} is now being processed. We will notify you when it is shipped.

Questions: info@tech4ru.com`;
}

// ─── MAIN POST HANDLER ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      orderId,
      status,
      customerEmail,
      customerPhone,
      customerName,
      orderNumber,
      courierName,
      courierCountry,
      estimatedDays,
      trackingNumber,
      courierTrackingUrl,
      shippingAddress,
      paymentMethod,
      // ✅ FIXED: page.tsx sends "items" AND "orderItems" — accept both
      items: itemsDirect,
      orderItems,
      subtotal,
      totalAmount,
      customerCountry, // ✅ NEW: customer's country for currency conversion
    } = body;

    // items can come as "items" or "orderItems" from page.tsx
    const items = itemsDirect || orderItems || [];

    // ── Validation ────────────────────────────────────────────────────────────
    if (
      !orderId ||
      !status ||
      !customerEmail ||
      !customerName ||
      !orderNumber
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const validStatuses = [
      "shipped",
      "delivered",
      "cancelled",
      "confirmed",
      "processing",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    // ── Step 1: DB update ─────────────────────────────────────────────────────
    const supabase = getClient();
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "shipped") {
      if (courierName) updatePayload.courier_name = courierName;
      if (courierCountry) updatePayload.courier_country = courierCountry;
      if (estimatedDays) updatePayload.estimated_days = estimatedDays;
      if (trackingNumber) updatePayload.tracking_number = trackingNumber;
      if (courierTrackingUrl)
        updatePayload.courier_tracking_url = courierTrackingUrl;
      updatePayload.shipped_at = new Date().toISOString();
    }

    const { error: dbError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (dbError) {
      console.error("DB error:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // ── Step 2: Prepare formatted items ──────────────────────────────────────
    const formattedItems =
      items?.map((item: any) => ({
        name: item.product_name || item.name || "Product",
        variant: item.variant_name || null,
        quantity: item.quantity,
        formattedPrice: `PKR ${(item.price * (item.pieces_per_unit || 1)).toLocaleString()}`,
        pricePKR: item.price * (item.pieces_per_unit || 1),
        variant_image: item.variant_image || null,
        image: item.image || null,
        product_image: item.product_image || null,
      })) || [];

    const formattedTotal = totalAmount
      ? `PKR ${totalAmount.toLocaleString()}`
      : undefined;

    // country for currency conversion — use customerCountry from body
    const country = customerCountry || "Pakistan";

    // ── Step 3: Notifications ─────────────────────────────────────────────────
    let whatsappMsg = "";
    let customerEmailSent = false;
    let ownerEmailSent = false;
    let whatsappSent = false;

    if (status === "shipped") {
      const cn = courierName || "Courier";
      const tn = trackingNumber || "N/A";
      const ed = estimatedDays || "3-5 business days";
      whatsappMsg = shippedWA(customerName, orderNumber, cn, tn, ed);

      const [emailResult, ownerResult] = await Promise.all([
        sendStatusUpdateEmail(
          customerEmail,
          customerName,
          orderNumber,
          "shipped",
          tn,
          cn,
          undefined, // ✅ NO tracking URL in customer email
          ed,
          items || [],
          formattedItems,
          formattedTotal,
          country, // ✅ currency conversion
        ),
        sendOwnerStatusAlert(
          orderNumber,
          customerName,
          customerEmail,
          customerPhone || "",
          "shipped",
          `${cn} | Tracking: ${tn} | Est: ${ed}`,
        ),
      ]);
      customerEmailSent = emailResult;
      ownerEmailSent = ownerResult;
    } else if (status === "delivered") {
      whatsappMsg = deliveredWA(customerName, orderNumber);

      const [emailResult, ownerResult] = await Promise.all([
        sendStatusUpdateEmail(
          customerEmail,
          customerName,
          orderNumber,
          "delivered",
          undefined,
          undefined,
          undefined,
          undefined,
          items || [],
          formattedItems,
          formattedTotal,
          country, // ✅ currency conversion
        ),
        sendOwnerStatusAlert(
          orderNumber,
          customerName,
          customerEmail,
          customerPhone || "",
          "delivered",
        ),
      ]);
      customerEmailSent = emailResult;
      ownerEmailSent = ownerResult;
    } else if (status === "cancelled") {
      whatsappMsg = cancelledWA(customerName, orderNumber);

      const [emailResult, ownerResult] = await Promise.all([
        sendStatusUpdateEmail(
          customerEmail,
          customerName,
          orderNumber,
          "cancelled",
          undefined,
          undefined,
          undefined,
          undefined,
          items || [],
          formattedItems,
          formattedTotal,
          country, // ✅ currency conversion
        ),
        sendOwnerStatusAlert(
          orderNumber,
          customerName,
          customerEmail,
          customerPhone || "",
          "cancelled",
        ),
      ]);
      customerEmailSent = emailResult;
      ownerEmailSent = ownerResult;
    } else if (status === "confirmed") {
      whatsappMsg = confirmedWA(customerName, orderNumber);

      const [emailResult, ownerResult] = await Promise.all([
        sendOrderConfirmationEmail(
          customerEmail,
          orderNumber,
          customerName,
          items || [],
          totalAmount || 0,
          shippingAddress || "",
          paymentMethod || "N/A",
          "PKR",
          formattedTotal,
          formattedItems,
          country, // ✅ currency conversion
        ),
        sendOwnerOrderAlert(
          orderNumber,
          customerName,
          customerEmail,
          customerPhone || "",
          items || [],
          totalAmount || 0,
          shippingAddress || "",
          paymentMethod || "N/A",
          "PKR",
          formattedTotal,
          formattedItems,
          country, // ✅ owner sees customer's country
        ),
      ]);
      customerEmailSent = emailResult;
      ownerEmailSent = ownerResult;
    } else if (status === "processing") {
      whatsappMsg = processingWA(customerName, orderNumber);

      const [emailResult, ownerResult] = await Promise.all([
        sendStatusUpdateEmail(
          customerEmail,
          customerName,
          orderNumber,
          "processing",
          undefined,
          undefined,
          undefined,
          undefined,
          items || [],
          formattedItems,
          formattedTotal,
          country, // ✅ currency conversion
        ),
        sendOwnerStatusAlert(
          orderNumber,
          customerName,
          customerEmail,
          customerPhone || "",
          "processing",
          "Order is being processed",
        ),
      ]);
      customerEmailSent = emailResult;
      ownerEmailSent = ownerResult;
    }

    // ── WhatsApp ──────────────────────────────────────────────────────────────
    if (customerPhone && whatsappMsg) {
      whatsappSent = await sendWhatsAppMessage(customerPhone, whatsappMsg);
    }

    console.log(`Notifications [${orderNumber}] ${status}:`, {
      whatsapp: whatsappSent ? "sent" : "failed",
      customerEmail: customerEmailSent ? "sent" : "failed",
      ownerEmail: ownerEmailSent ? "sent" : "failed",
      country,
    });

    return NextResponse.json({
      success: true,
      status,
      whatsappSent,
      emailSent: customerEmailSent,
      ownerEmailSent,
    });
  } catch (err: any) {
    console.error("update-order-status error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
