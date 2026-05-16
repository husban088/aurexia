// app/api/admin/update-order-status/route.ts
// ✅ Only 3 status buttons: shipped | delivered | cancelled
// ✅ confirmed is handled by send-order-notification (on checkout)
// ✅ processing removed from admin panel
// ✅ Currency by customer country in all emails + WhatsApp
// ✅ PAID PLAN: Product image sent with WhatsApp for ALL statuses

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendShippedWhatsApp,
  sendDeliveredWhatsApp,
  sendCancelledWhatsApp,
} from "@/lib/whatsapp";
import { sendStatusUpdateEmail, sendOwnerStatusAlert } from "@/lib/email-smtp";

// ── Currency helpers ──────────────────────────────────────────────────────────
const PKR_RATES: Record<
  string,
  { symbol: string; rate: number; code: string }
> = {
  Pakistan: { symbol: "Rs.", rate: 1, code: "PKR" },
  "United States": { symbol: "$", rate: 0.0036, code: "USD" },
  USA: { symbol: "$", rate: 0.0036, code: "USD" },
  US: { symbol: "$", rate: 0.0036, code: "USD" },
  "United Kingdom": { symbol: "GBP", rate: 0.0028, code: "GBP" },
  UK: { symbol: "GBP", rate: 0.0028, code: "GBP" },
  GB: { symbol: "GBP", rate: 0.0028, code: "GBP" },
  England: { symbol: "GBP", rate: 0.0028, code: "GBP" },
  Australia: { symbol: "A$", rate: 0.0055, code: "AUD" },
  AU: { symbol: "A$", rate: 0.0055, code: "AUD" },
  Canada: { symbol: "C$", rate: 0.0049, code: "CAD" },
  CA: { symbol: "C$", rate: 0.0049, code: "CAD" },
  "United Arab Emirates": { symbol: "AED", rate: 0.013, code: "AED" },
  UAE: { symbol: "AED", rate: 0.013, code: "AED" },
  AE: { symbol: "AED", rate: 0.013, code: "AED" },
  Dubai: { symbol: "AED", rate: 0.013, code: "AED" },
  "Saudi Arabia": { symbol: "SAR", rate: 0.013, code: "SAR" },
  SA: { symbol: "SAR", rate: 0.013, code: "SAR" },
  KSA: { symbol: "SAR", rate: 0.013, code: "SAR" },
  India: { symbol: "Rs", rate: 0.3, code: "INR" },
  IN: { symbol: "Rs", rate: 0.3, code: "INR" },
  Germany: { symbol: "EUR", rate: 0.0033, code: "EUR" },
  France: { symbol: "EUR", rate: 0.0033, code: "EUR" },
  Italy: { symbol: "EUR", rate: 0.0033, code: "EUR" },
  Spain: { symbol: "EUR", rate: 0.0033, code: "EUR" },
  Netherlands: { symbol: "EUR", rate: 0.0033, code: "EUR" },
};

function getCurrencyForCountry(country: string) {
  if (!country) return PKR_RATES["Pakistan"];
  if (PKR_RATES[country]) return PKR_RATES[country];
  const lower = country.toLowerCase();
  for (const [key, val] of Object.entries(PKR_RATES)) {
    if (key.toLowerCase() === lower || lower.includes(key.toLowerCase()))
      return val;
  }
  return PKR_RATES["Pakistan"];
}

function formatAmount(amountPKR: number, country: string): string {
  const cfg = getCurrencyForCountry(country);
  if (cfg.code === "PKR")
    return `Rs. ${Math.round(amountPKR).toLocaleString("en-PK")}`;
  if (cfg.code === "INR")
    return `Rs ${Math.round(amountPKR * cfg.rate).toLocaleString("en-IN")}`;
  const converted = amountPKR * cfg.rate;
  return `${cfg.symbol} ${converted.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

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
      items: itemsDirect,
      orderItems,
      totalAmount,
      customerCountry,
      cancelReason,
    } = body;

    // items array — support both field names
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

    // ✅ Only 3 valid statuses — confirmed and processing removed from admin
    const validStatuses = ["shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    // ── Currency setup ────────────────────────────────────────────────────────
    const country = customerCountry || "Pakistan";
    const currencyCfg = getCurrencyForCountry(country);
    const totalAmountNum = totalAmount || 0;
    const formattedTotal = formatAmount(totalAmountNum, country);

    console.log(
      `🌍 [${orderNumber}] ${status.toUpperCase()} | Country: ${country} | Currency: ${currencyCfg.code} | Total: ${formattedTotal}`,
    );

    // ── DB Update ─────────────────────────────────────────────────────────────
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
      console.error("❌ DB error:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // ── Formatted items (for email) ───────────────────────────────────────────
    const formattedItems = items.map((item: any) => ({
      name: item.product_name || item.name || "Product",
      variant: item.variant_name || null,
      quantity: item.quantity,
      price: item.price,
      piecesPerUnit: item.pieces_per_unit || 1,
      formattedPrice: formatAmount(
        (item.price || 0) * (item.pieces_per_unit || 1) * (item.quantity || 1),
        country,
      ),
      pricePKR: (item.price || 0) * (item.pieces_per_unit || 1),
      variant_image: item.variant_image || null,
      image: item.image || null,
      product_image: item.product_image || null,
    }));

    // ── WhatsApp items — raw PKR + image fields ───────────────────────────────
    // sendShippedWhatsApp / sendDeliveredWhatsApp / sendCancelledWhatsApp
    // need image fields to pick product image
    const waItems = items.map((item: any) => ({
      name: item.product_name || item.name || "Product",
      variant: item.variant_name || null,
      quantity: item.quantity,
      price: item.price,
      piecesPerUnit: item.pieces_per_unit || 1,
      // ✅ image fields passed so WhatsApp can pick product image
      variant_image: item.variant_image || null,
      image: item.image || null,
      product_image: item.product_image || null,
    }));

    let customerEmailSent = false;
    let ownerEmailSent = false;
    let whatsappSent = false;

    // ── SHIPPED ───────────────────────────────────────────────────────────────
    if (status === "shipped") {
      const cn = courierName || "Courier";
      const tn = trackingNumber || "N/A";
      const ed = estimatedDays || "3-5 business days";

      // ✅ Email and WhatsApp in parallel
      // WhatsApp uses sendShippedWhatsApp which sends image first, then text
      const [emailResult, ownerResult, waResult] = await Promise.all([
        sendStatusUpdateEmail(
          customerEmail,
          customerName,
          orderNumber,
          "shipped",
          tn,
          cn,
          courierTrackingUrl,
          ed,
          items,
          formattedItems,
          formattedTotal,
          country,
        ),
        sendOwnerStatusAlert(
          orderNumber,
          customerName,
          customerEmail,
          customerPhone || "",
          "shipped",
          `${cn} | Tracking: ${tn} | Est: ${ed}`,
        ),
        // ✅ Image + text WhatsApp for shipped
        customerPhone
          ? sendShippedWhatsApp(
              customerPhone,
              customerName,
              orderNumber,
              cn,
              tn,
              ed,
              courierTrackingUrl,
              waItems,
              totalAmountNum,
              country,
            )
          : Promise.resolve(false),
      ]);

      customerEmailSent = emailResult;
      ownerEmailSent = ownerResult;
      whatsappSent = waResult;
    }

    // ── DELIVERED ─────────────────────────────────────────────────────────────
    else if (status === "delivered") {
      const [emailResult, ownerResult, waResult] = await Promise.all([
        sendStatusUpdateEmail(
          customerEmail,
          customerName,
          orderNumber,
          "delivered",
          undefined,
          undefined,
          undefined,
          undefined,
          items,
          formattedItems,
          formattedTotal,
          country,
        ),
        sendOwnerStatusAlert(
          orderNumber,
          customerName,
          customerEmail,
          customerPhone || "",
          "delivered",
        ),
        // ✅ Image + text WhatsApp for delivered
        customerPhone
          ? sendDeliveredWhatsApp(
              customerPhone,
              customerName,
              orderNumber,
              waItems,
              totalAmountNum,
              country,
            )
          : Promise.resolve(false),
      ]);

      customerEmailSent = emailResult;
      ownerEmailSent = ownerResult;
      whatsappSent = waResult;
    }

    // ── CANCELLED ─────────────────────────────────────────────────────────────
    else if (status === "cancelled") {
      const [emailResult, ownerResult, waResult] = await Promise.all([
        sendStatusUpdateEmail(
          customerEmail,
          customerName,
          orderNumber,
          "cancelled",
          undefined,
          undefined,
          undefined,
          undefined,
          items,
          formattedItems,
          formattedTotal,
          country,
          cancelReason,
        ),
        sendOwnerStatusAlert(
          orderNumber,
          customerName,
          customerEmail,
          customerPhone || "",
          "cancelled",
          cancelReason ? `Reason: ${cancelReason}` : undefined,
        ),
        // ✅ Image + text WhatsApp for cancelled
        customerPhone
          ? sendCancelledWhatsApp(
              customerPhone,
              customerName,
              orderNumber,
              cancelReason,
              waItems,
              totalAmountNum,
              country,
            )
          : Promise.resolve(false),
      ]);

      customerEmailSent = emailResult;
      ownerEmailSent = ownerResult;
      whatsappSent = waResult;
    }

    console.log(`📊 [${orderNumber}] ${status.toUpperCase()} results:`, {
      whatsapp: whatsappSent ? "✅" : "❌",
      customerEmail: customerEmailSent ? "✅" : "❌",
      ownerEmail: ownerEmailSent ? "✅" : "❌",
      country,
      currency: currencyCfg.code,
      total: formattedTotal,
      itemsCount: items.length,
      hasImages: waItems.some(
        (i: any) => i.variant_image || i.image || i.product_image,
      ),
    });

    return NextResponse.json({
      success: true,
      status,
      whatsappSent,
      emailSent: customerEmailSent,
      ownerEmailSent,
    });
  } catch (err: any) {
    console.error("❌ update-order-status crash:", err?.message || err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
