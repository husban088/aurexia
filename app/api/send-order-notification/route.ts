// app/api/send-order-notification/route.ts
// ✅ WhatsApp: sendOrderWhatsApp (same as update-order-status pattern)
// ✅ Currency by customer country
// ✅ Items + total in every WhatsApp message
// ✅ Detailed Vercel error logging

import { NextRequest, NextResponse } from "next/server";
import {
  sendOrderConfirmationEmail,
  sendOwnerOrderAlert,
} from "@/lib/email-smtp";
import { sendOrderWhatsApp } from "@/lib/whatsapp";

// ── Currency helpers (matching whatsapp.ts + update-order-status) ────────────
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
  England: { symbol: "£", rate: 0.0028, code: "GBP" },
  Australia: { symbol: "A$", rate: 0.0055, code: "AUD" },
  AU: { symbol: "A$", rate: 0.0055, code: "AUD" },
  Canada: { symbol: "C$", rate: 0.0049, code: "CAD" },
  CA: { symbol: "C$", rate: 0.0049, code: "CAD" },
  "United Arab Emirates": { symbol: "AED", rate: 0.013, code: "AED" },
  UAE: { symbol: "AED", rate: 0.013, code: "AED" },
  AE: { symbol: "AED", rate: 0.013, code: "AED" },
  Dubai: { symbol: "AED", rate: 0.013, code: "AED" },
  "Saudi Arabia": { symbol: "﷼", rate: 0.013, code: "SAR" },
  SA: { symbol: "﷼", rate: 0.013, code: "SAR" },
  KSA: { symbol: "﷼", rate: 0.013, code: "SAR" },
  India: { symbol: "₹", rate: 0.3, code: "INR" },
  IN: { symbol: "₹", rate: 0.3, code: "INR" },
  Germany: { symbol: "€", rate: 0.0033, code: "EUR" },
  France: { symbol: "€", rate: 0.0033, code: "EUR" },
  Italy: { symbol: "€", rate: 0.0033, code: "EUR" },
  Spain: { symbol: "€", rate: 0.0033, code: "EUR" },
  Netherlands: { symbol: "€", rate: 0.0033, code: "EUR" },
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
  return `${cfg.symbol}${converted.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// POST /api/send-order-notification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      orderNumber,
      email,
      phone,
      name,
      items,
      total,
      shippingAddress,
      paymentMethod,
      currency,
      customerCountry,
    } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!orderNumber || !email || !name || !items?.length) {
      console.error("❌ Missing required fields:", {
        orderNumber: !!orderNumber,
        email: !!email,
        name: !!name,
        itemsCount: items?.length ?? 0,
      });
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // ── ENV check ─────────────────────────────────────────────────────────────
    if (!process.env.WASENDER_API_KEY) {
      console.error("❌ WASENDER_API_KEY missing from environment variables!");
    }
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("❌ GMAIL_USER or GMAIL_APP_PASSWORD missing!");
    }

    // ── Currency ──────────────────────────────────────────────────────────────
    const country = customerCountry || "Pakistan";
    const currencyCfg = getCurrencyForCountry(country);
    const isPKR = currencyCfg.code === "PKR";
    const totalAmountNum = total ?? 0;
    const formattedTotal = formatAmount(totalAmountNum, country);
    const currencyNote = !isPKR
      ? `\n💱 _Amount in ${currencyCfg.code} (approx.)_`
      : "";
    const customerPhone = phone || "";

    console.log(
      `📦 Order notification: ${orderNumber} | Country: "${country}" | Currency: ${currencyCfg.code} | Phone: ${customerPhone || "MISSING"} | Email: ${email}`,
    );
    console.log(
      `💰 Total: ${totalAmountNum} PKR → ${formattedTotal} (${currencyCfg.code})`,
    );
    console.log(`🛒 Items count: ${items.length}`);

    // ── formattedItems for email ──────────────────────────────────────────────
    // item.price = per-unit PKR price (from page.tsx)
    // item.pricePKR = line total PKR (qty already multiplied) — fallback
    const formattedItems = items.map((item: any) => {
      const perUnitPKR = item.price ?? 0;
      const ppu = item.piecesPerUnit ?? item.pieces_per_unit ?? 1;
      const qty = item.quantity ?? 1;
      const lineTotalPKR = perUnitPKR * ppu * qty;
      return {
        name: item.name ?? item.product_name ?? "Product",
        variant: item.variant ?? item.variant_name ?? null,
        quantity: qty,
        formattedPrice: formatAmount(lineTotalPKR, country),
        pricePKR: lineTotalPKR,
        image: item.image ?? item.variant_image ?? item.product_image ?? null,
      };
    });

    // ── waItems for WhatsApp (sendOrderWhatsApp handles price * ppu * qty) ────
    // price = per-unit PKR, piecesPerUnit = pieces per unit
    const waItems = items.map((item: any) => ({
      name: item.name ?? item.product_name ?? "Product",
      variant: item.variant ?? item.variant_name ?? null,
      quantity: item.quantity ?? 1,
      price: item.price ?? 0, // ✅ per-unit PKR only — whatsapp.ts multiplies itself
      piecesPerUnit: item.piecesPerUnit ?? item.pieces_per_unit ?? 1,
      image: item.image ?? item.variant_image ?? item.product_image ?? null,
      variant_image: item.variant_image ?? null,
      product_image: item.product_image ?? null,
    }));

    // ── Send all 3 notifications ──────────────────────────────────────────────
    let whatsappSent = false;
    let customerEmailSent = false;
    let ownerEmailSent = false;

    // ── WhatsApp ──────────────────────────────────────────────────────────────
    if (customerPhone) {
      try {
        whatsappSent = await sendOrderWhatsApp(
          customerPhone,
          orderNumber,
          name,
          totalAmountNum, // ✅ total PKR
          waItems, // ✅ per-unit price, whatsapp.ts handles multiplication
          formattedTotal, // ✅ pre-formatted for display
          formattedItems, // ✅ optional, whatsapp.ts rebuilds anyway
          country, // ✅ "Australia", "United Kingdom" etc.
        );
        if (whatsappSent) {
          console.log(`✅ WhatsApp sent → ${customerPhone}`);
        } else {
          console.error(
            `❌ WhatsApp returned false → ${customerPhone} | WasenderAPI session check: https://wasenderapi.com/dashboard`,
          );
        }
      } catch (err: any) {
        console.error("❌ WhatsApp EXCEPTION:", err?.message || err);
      }
    } else {
      console.warn("⚠️ No phone number — WhatsApp skipped");
    }

    // ── Customer Email ────────────────────────────────────────────────────────
    try {
      customerEmailSent = await sendOrderConfirmationEmail(
        email,
        orderNumber,
        name,
        items,
        totalAmountNum,
        shippingAddress || "",
        paymentMethod || "N/A",
        currencyCfg.code,
        formattedTotal,
        formattedItems,
        country,
      );
      if (!customerEmailSent)
        console.error(
          "❌ Customer Email returned false — Gmail SMTP check karo!",
        );
    } catch (err: any) {
      console.error("❌ Customer Email EXCEPTION:", err?.message || err);
    }

    // ── Owner Email ───────────────────────────────────────────────────────────
    try {
      ownerEmailSent = await sendOwnerOrderAlert(
        orderNumber,
        name,
        email,
        customerPhone,
        items,
        totalAmountNum,
        shippingAddress || "",
        paymentMethod || "N/A",
        currencyCfg.code,
        formattedTotal,
        formattedItems,
        country,
      );
      if (!ownerEmailSent) console.error("❌ Owner Email returned false");
    } catch (err: any) {
      console.error("❌ Owner Email EXCEPTION:", err?.message || err);
    }

    // ── Summary Log ───────────────────────────────────────────────────────────
    console.log(`📊 Results [${orderNumber}] confirmed:`, {
      country,
      currency: currencyCfg.code,
      phone: customerPhone || "NOT PROVIDED",
      whatsapp: whatsappSent ? "✅ sent" : "❌ failed",
      customerEmail: customerEmailSent ? "✅ sent" : "❌ failed",
      ownerEmail: ownerEmailSent ? "✅ sent" : "❌ failed",
    });

    return NextResponse.json({
      success: true,
      results: {
        emailSent: customerEmailSent,
        whatsappSent,
        ownerEmailSent,
      },
    });
  } catch (error: any) {
    console.error("❌ send-order-notification CRASH:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
