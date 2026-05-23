// app/api/admin/update-order-status/route.ts
// ✅ Only 3 status buttons: shipped | delivered | cancelled
// ✅ confirmed is handled by send-order-notification (on checkout)
// ✅ Currency by customer country in all emails + WhatsApp
// ✅ PAID PLAN: Product image sent with WhatsApp for ALL statuses
// ✅ When status = "delivered", customer email saved to
//    delivered_customers table → unlocks coupon codes for them
// ✅ FIXED: Currency symbols corrected (£ € ₹ instead of text)
// ✅ FIXED: EUR rate 0.003049, AED rate 0.013082 (synced with currency.ts)
// ✅ FIXED: "Europe" key added as safety fallback

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendShippedWhatsApp,
  sendDeliveredWhatsApp,
  sendCancelledWhatsApp,
} from "@/lib/whatsapp";
import { sendStatusUpdateEmail, sendOwnerStatusAlert } from "@/lib/email-smtp";

// ── Currency helpers ──────────────────────────────────────────────────────────
// ✅ FIXED: All rates + symbols synced with currency.ts (May 2026 open market)
const PKR_RATES: Record<
  string,
  { symbol: string; rate: number; code: string }
> = {
  Pakistan: { symbol: "Rs. ", rate: 1, code: "PKR" },
  "United States": { symbol: "$", rate: 0.003584, code: "USD" }, // 1 USD = 279 PKR
  USA: { symbol: "$", rate: 0.003584, code: "USD" },
  US: { symbol: "$", rate: 0.003584, code: "USD" },
  "United Kingdom": { symbol: "£", rate: 0.002639, code: "GBP" }, // ✅ FIXED: £ not "GBP"
  UK: { symbol: "£", rate: 0.002639, code: "GBP" },
  GB: { symbol: "£", rate: 0.002639, code: "GBP" },
  England: { symbol: "£", rate: 0.002639, code: "GBP" },
  Australia: { symbol: "A$", rate: 0.005, code: "AUD" }, // 1 AUD = 200 PKR
  AU: { symbol: "A$", rate: 0.005, code: "AUD" },
  Canada: { symbol: "C$", rate: 0.004878, code: "CAD" }, // 1 CAD = 205 PKR
  CA: { symbol: "C$", rate: 0.004878, code: "CAD" },
  "United Arab Emirates": { symbol: "AED ", rate: 0.013082, code: "AED" }, // ✅ FIXED: 0.013082
  UAE: { symbol: "AED ", rate: 0.013082, code: "AED" },
  AE: { symbol: "AED ", rate: 0.013082, code: "AED" },
  Dubai: { symbol: "AED ", rate: 0.013082, code: "AED" },
  "Saudi Arabia": { symbol: "SAR ", rate: 0.013357, code: "SAR" }, // 1 SAR = 74.87 PKR
  SA: { symbol: "SAR ", rate: 0.013357, code: "SAR" },
  KSA: { symbol: "SAR ", rate: 0.013357, code: "SAR" },
  India: { symbol: "₹", rate: 0.298507, code: "INR" }, // ✅ FIXED: ₹ not "Rs"
  IN: { symbol: "₹", rate: 0.298507, code: "INR" },
  Germany: { symbol: "€", rate: 0.003049, code: "EUR" }, // ✅ FIXED: € not "EUR", rate 0.003049
  Europe: { symbol: "€", rate: 0.003049, code: "EUR" }, // ✅ NEW: safety fallback
  France: { symbol: "€", rate: 0.003049, code: "EUR" },
  Italy: { symbol: "€", rate: 0.003049, code: "EUR" },
  Spain: { symbol: "€", rate: 0.003049, code: "EUR" },
  Netherlands: { symbol: "€", rate: 0.003049, code: "EUR" },
  Austria: { symbol: "€", rate: 0.003049, code: "EUR" },
  Belgium: { symbol: "€", rate: 0.003049, code: "EUR" },
  Portugal: { symbol: "€", rate: 0.003049, code: "EUR" },
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
    return `₹${Math.round(amountPKR * cfg.rate).toLocaleString("en-IN")}`;
  const converted = amountPKR * cfg.rate;
  // ✅ symbol already has trailing space for AED/SAR/Rs — others don't need space
  return `${cfg.symbol}${converted.toLocaleString("en-US", {
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

async function saveDeliveredCustomer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  email: string,
  orderNumber: string,
): Promise<void> {
  try {
    const { error } = await (supabase as any)
      .from("delivered_customers")
      .upsert(
        {
          email: email.trim().toLowerCase(),
          order_number: orderNumber,
          delivered_at: new Date().toISOString(),
        },
        { onConflict: "email,order_number" },
      );

    if (error) {
      console.error("❌ saveDeliveredCustomer DB error:", error.message);
    } else {
      console.log(
        `✅ Delivered customer saved: ${email} | order ${orderNumber}`,
      );
    }
  } catch (err: any) {
    console.error("❌ saveDeliveredCustomer exception:", err?.message || err);
  }
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

    const items = itemsDirect || orderItems || [];

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

    const validStatuses = ["shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    const country = customerCountry || "Pakistan";
    const currencyCfg = getCurrencyForCountry(country);
    const totalAmountNum = totalAmount || 0;
    const formattedTotal = formatAmount(totalAmountNum, country);

    console.log(
      `🌍 [${orderNumber}] ${status.toUpperCase()} | Country: ${country} | Currency: ${currencyCfg.code} | Total: ${formattedTotal}`,
    );

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

    const { error: dbError } = await (supabase as any)
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (dbError) {
      console.error("❌ DB error:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (status === "delivered" && customerEmail) {
      await saveDeliveredCustomer(supabase, customerEmail, orderNumber);
    }

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

    const waItems = items.map((item: any) => ({
      name: item.product_name || item.name || "Product",
      variant: item.variant_name || null,
      quantity: item.quantity,
      price: item.price,
      piecesPerUnit: item.pieces_per_unit || 1,
      variant_image: item.variant_image || null,
      image: item.image || null,
      product_image: item.product_image || null,
    }));

    let customerEmailSent = false;
    let ownerEmailSent = false;
    let whatsappSent = false;

    if (status === "shipped") {
      const cn = courierName || "Courier";
      const tn = trackingNumber || "N/A";
      const ed = estimatedDays || "3-5 business days";

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
    } else if (status === "delivered") {
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
    } else if (status === "cancelled") {
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
      couponEligibilitySaved: status === "delivered" ? "✅" : "n/a",
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
