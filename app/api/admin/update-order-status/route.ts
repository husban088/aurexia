// app/api/admin/update-order-status/route.ts
// ✅ Uses new WhatsApp builder functions — same content as email
// ✅ Currency by customer country
// ✅ Items + total in every WhatsApp message

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendWhatsAppMessage,
  buildShippedWhatsApp,
  buildDeliveredWhatsApp,
  buildCancelledWhatsApp,
  buildConfirmedWhatsApp,
  buildProcessingWhatsApp,
} from "@/lib/whatsapp";
import {
  sendStatusUpdateEmail,
  sendOwnerStatusAlert,
  sendOrderConfirmationEmail,
  sendOwnerOrderAlert,
} from "@/lib/email-smtp";

// ── Currency helpers (matching whatsapp.ts + email.ts) ───────────────────────
const PKR_RATES: Record<
  string,
  { symbol: string; rate: number; code: string }
> = {
  Pakistan: { symbol: "₨", rate: 1, code: "PKR" },
  "United States": { symbol: "$", rate: 0.0036, code: "USD" },
  USA: { symbol: "$", rate: 0.0036, code: "USD" },
  US: { symbol: "$", rate: 0.0036, code: "USD" },
  "United Kingdom": { symbol: "£", rate: 0.0028, code: "GBP" },
  UK: { symbol: "£", rate: 0.0028, code: "GBP" },
  GB: { symbol: "£", rate: 0.0028, code: "GBP" },
  Australia: { symbol: "A$", rate: 0.0055, code: "AUD" },
  AU: { symbol: "A$", rate: 0.0055, code: "AUD" },
  Canada: { symbol: "C$", rate: 0.0049, code: "CAD" },
  CA: { symbol: "C$", rate: 0.0049, code: "CAD" },
  "United Arab Emirates": { symbol: "AED", rate: 0.013, code: "AED" },
  UAE: { symbol: "AED", rate: 0.013, code: "AED" },
  AE: { symbol: "AED", rate: 0.013, code: "AED" },
  "Saudi Arabia": { symbol: "﷼", rate: 0.013, code: "SAR" },
  SA: { symbol: "﷼", rate: 0.013, code: "SAR" },
  India: { symbol: "₹", rate: 0.3, code: "INR" },
  IN: { symbol: "₹", rate: 0.3, code: "INR" },
  Germany: { symbol: "€", rate: 0.0033, code: "EUR" },
  France: { symbol: "€", rate: 0.0033, code: "EUR" },
  Italy: { symbol: "€", rate: 0.0033, code: "EUR" },
  Spain: { symbol: "€", rate: 0.0033, code: "EUR" },
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
    return `₨ ${Math.round(amountPKR).toLocaleString("en-PK")}`;
  if (cfg.code === "INR")
    return `₹${Math.round(amountPKR * cfg.rate).toLocaleString("en-IN")}`;
  const converted = amountPKR * cfg.rate;
  return `${cfg.symbol}${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      subtotal,
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

    // ── Currency ──────────────────────────────────────────────────────────────
    const country = customerCountry || "Pakistan";
    const currencyCfg = getCurrencyForCountry(country);
    const isPKR = currencyCfg.code === "PKR";
    const totalAmountNum = totalAmount || 0;
    const formattedTotal = formatAmount(totalAmountNum, country);
    const currencyNote = !isPKR
      ? `\n💱 _Amount in ${currencyCfg.code} (approx.)_`
      : "";

    console.log(
      `🌍 [${orderNumber}] ${status} | Country: ${country} → Currency: ${currencyCfg.code}`,
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
      console.error("DB error:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // ── Formatted items for email ─────────────────────────────────────────────
    const formattedItems =
      items?.map((item: any) => ({
        name: item.product_name || item.name || "Product",
        variant: item.variant_name || null,
        quantity: item.quantity,
        price: item.price,
        piecesPerUnit: item.pieces_per_unit || 1,
        formattedPrice: formatAmount(
          item.price * (item.pieces_per_unit || 1),
          country,
        ),
        pricePKR: item.price * (item.pieces_per_unit || 1),
        variant_image: item.variant_image || null,
        image: item.image || null,
        product_image: item.product_image || null,
      })) || [];

    // ── Normalized items for WhatsApp builder ─────────────────────────────────
    const waItems =
      items?.map((item: any) => ({
        name: item.product_name || item.name || "Product",
        variant: item.variant_name || null,
        quantity: item.quantity,
        price: item.price,
        piecesPerUnit: item.pieces_per_unit || 1,
      })) || [];

    // ── Build messages + send emails ──────────────────────────────────────────
    let whatsappMsg = "";
    let customerEmailSent = false;
    let ownerEmailSent = false;
    let whatsappSent = false;

    if (status === "shipped") {
      const cn = courierName || "Courier";
      const tn = trackingNumber || "N/A";
      const ed = estimatedDays || "3-5 business days";

      whatsappMsg = buildShippedWhatsApp(
        customerName,
        orderNumber,
        cn,
        tn,
        ed,
        courierTrackingUrl,
        waItems,
        totalAmountNum,
        country,
      );

      const [emailResult, ownerResult] = await Promise.all([
        sendStatusUpdateEmail(
          customerEmail,
          customerName,
          orderNumber,
          "shipped",
          tn,
          cn,
          courierTrackingUrl,
          ed,
          items || [],
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
      ]);
      customerEmailSent = emailResult;
      ownerEmailSent = ownerResult;
    } else if (status === "delivered") {
      whatsappMsg = buildDeliveredWhatsApp(
        customerName,
        orderNumber,
        waItems,
        totalAmountNum,
        country,
      );

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
          country,
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
      whatsappMsg = buildCancelledWhatsApp(
        customerName,
        orderNumber,
        cancelReason,
        waItems,
        totalAmountNum,
        country,
      );

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
      ]);
      customerEmailSent = emailResult;
      ownerEmailSent = ownerResult;
    } else if (status === "confirmed") {
      whatsappMsg = buildConfirmedWhatsApp(
        customerName,
        orderNumber,
        formattedTotal,
        currencyNote,
        waItems,
        country,
      );

      const [emailResult, ownerResult] = await Promise.all([
        sendOrderConfirmationEmail(
          customerEmail,
          orderNumber,
          customerName,
          items || [],
          totalAmountNum,
          shippingAddress || "",
          paymentMethod || "N/A",
          currencyCfg.code,
          formattedTotal,
          formattedItems,
          country,
        ),
        sendOwnerOrderAlert(
          orderNumber,
          customerName,
          customerEmail,
          customerPhone || "",
          items || [],
          totalAmountNum,
          shippingAddress || "",
          paymentMethod || "N/A",
          currencyCfg.code,
          formattedTotal,
          formattedItems,
          country,
        ),
      ]);
      customerEmailSent = emailResult;
      ownerEmailSent = ownerResult;
    } else if (status === "processing") {
      whatsappMsg = buildProcessingWhatsApp(
        customerName,
        orderNumber,
        formattedTotal,
        waItems,
        country,
      );

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
          country,
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

    // ── Send WhatsApp ─────────────────────────────────────────────────────────
    if (customerPhone && whatsappMsg) {
      whatsappSent = await sendWhatsAppMessage(customerPhone, whatsappMsg);
    }

    console.log(`📊 Results [${orderNumber}] ${status}:`, {
      whatsapp: whatsappSent ? "✅" : "❌",
      customerEmail: customerEmailSent ? "✅" : "❌",
      ownerEmail: ownerEmailSent ? "✅" : "❌",
      country,
      currency: currencyCfg.code,
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
