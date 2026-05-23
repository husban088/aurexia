// app/api/send-order-notification/route.ts
// ✅ FIXED: Currency properly converted in WhatsApp + Email
// ✅ EUR rate synced with currency.ts (0.003049)
// ✅ AED rate synced with currency.ts (0.013082)
// ✅ "Europe" key added as safety fallback → EUR
// ✅ customerCountry → formattedTotal + formattedItems always in customer's currency

import { NextRequest, NextResponse } from "next/server";
import {
  sendOrderConfirmationEmail,
  sendOwnerOrderAlert,
} from "@/lib/email-smtp";
import { sendConfirmedWhatsApp } from "@/lib/whatsapp";

// ── Currency helpers ──────────────────────────────────────────────────────────
// ✅ FIXED: All rates synced with currency.ts (May 2026 open market rates)
const PKR_RATES: Record<
  string,
  { symbol: string; rate: number; code: string }
> = {
  Pakistan: { symbol: "₨", rate: 1, code: "PKR" },
  "United States": { symbol: "$", rate: 0.003584, code: "USD" }, // 1 USD = 279 PKR
  USA: { symbol: "$", rate: 0.003584, code: "USD" },
  US: { symbol: "$", rate: 0.003584, code: "USD" },
  "United Kingdom": { symbol: "£", rate: 0.002639, code: "GBP" }, // 1 GBP = 379 PKR
  UK: { symbol: "£", rate: 0.002639, code: "GBP" },
  GB: { symbol: "£", rate: 0.002639, code: "GBP" },
  England: { symbol: "£", rate: 0.002639, code: "GBP" },
  Australia: { symbol: "A$", rate: 0.005, code: "AUD" }, // 1 AUD = 200 PKR
  AU: { symbol: "A$", rate: 0.005, code: "AUD" },
  Canada: { symbol: "C$", rate: 0.004878, code: "CAD" }, // 1 CAD = 205 PKR
  CA: { symbol: "C$", rate: 0.004878, code: "CAD" },
  "United Arab Emirates": { symbol: "AED ", rate: 0.013082, code: "AED" }, // 1 AED = 76.45 PKR ✅ FIXED
  UAE: { symbol: "AED ", rate: 0.013082, code: "AED" },
  AE: { symbol: "AED ", rate: 0.013082, code: "AED" },
  Dubai: { symbol: "AED ", rate: 0.013082, code: "AED" },
  "Saudi Arabia": { symbol: "﷼", rate: 0.013357, code: "SAR" }, // 1 SAR = 74.87 PKR
  SA: { symbol: "﷼", rate: 0.013357, code: "SAR" },
  KSA: { symbol: "﷼", rate: 0.013357, code: "SAR" },
  India: { symbol: "₹", rate: 0.298507, code: "INR" }, // 1 INR = 3.35 PKR
  IN: { symbol: "₹", rate: 0.298507, code: "INR" },
  // ✅ FIXED: EUR rate synced + "Europe" key added as safety net
  Germany: { symbol: "€", rate: 0.003049, code: "EUR" }, // 1 EUR = 328 PKR
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
    return `₨ ${Math.round(amountPKR).toLocaleString("en-PK")}`;
  if (cfg.code === "INR")
    return `₹${Math.round(amountPKR * cfg.rate).toLocaleString("en-IN")}`;
  const converted = amountPKR * cfg.rate;
  return `${cfg.symbol}${converted.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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

    // ── Currency setup ────────────────────────────────────────────────────────
    const country = customerCountry || "Pakistan";
    const currencyCfg = getCurrencyForCountry(country);
    const totalAmountNum = total ?? 0;

    // ✅ formattedTotal — in customer's currency
    const formattedTotal = formatAmount(totalAmountNum, country);
    const customerPhone = phone || "";

    console.log(
      `📦 [${orderNumber}] Country: "${country}" | Currency: ${currencyCfg.code} | Phone: ${customerPhone || "MISSING"} | Email: ${email}`,
    );
    console.log(`💰 Total: ${totalAmountNum} PKR → ${formattedTotal}`);
    console.log(`🛒 Items: ${items.length}`);

    // ── formattedItems for email ──────────────────────────────────────────────
    const formattedItems = items.map((item: any) => {
      const ppu = item.piecesPerUnit ?? item.pieces_per_unit ?? 1;
      const perUnitPKR = item.price ?? 0;
      const qty = item.quantity ?? 1;
      const lineTotalPKR = perUnitPKR * ppu * qty;

      return {
        name: item.name ?? item.product_name ?? "Product",
        variant: item.variant ?? item.variant_name ?? null,
        quantity: qty,
        formattedPrice: formatAmount(lineTotalPKR, country),
        pricePKR: lineTotalPKR,
        image: item.image ?? null,
        variant_image: item.variant_image ?? null,
        product_image: item.product_image ?? null,
      };
    });

    // ── waItems for WhatsApp ──────────────────────────────────────────────────
    const waItems = items.map((item: any) => ({
      name: item.name ?? item.product_name ?? "Product",
      variant: item.variant ?? item.variant_name ?? null,
      quantity: item.quantity ?? 1,
      price: item.price ?? 0,
      piecesPerUnit: item.piecesPerUnit ?? item.pieces_per_unit ?? 1,
      variant_image: item.variant_image ?? null,
      image: item.image ?? null,
      product_image: item.product_image ?? null,
    }));

    let customerEmailSent = false;
    let ownerEmailSent = false;
    let whatsappSent = false;

    // ── 1. WhatsApp ───────────────────────────────────────────────────────────
    if (customerPhone) {
      try {
        whatsappSent = await sendConfirmedWhatsApp(
          customerPhone,
          name,
          orderNumber,
          formattedTotal,
          waItems,
          country,
        );
        console.log(
          whatsappSent
            ? `✅ WhatsApp sent → ${customerPhone} (${currencyCfg.code}) [image+text]`
            : `❌ WhatsApp failed → ${customerPhone}`,
        );
      } catch (err: any) {
        console.error("❌ WhatsApp EXCEPTION:", err?.message || err);
      }
    } else {
      console.warn("⚠️ No phone — WhatsApp skipped");
    }

    // ── 2. Customer Confirmation Email ────────────────────────────────────────
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
      console.log(
        customerEmailSent
          ? `✅ Customer email sent (${currencyCfg.code}: ${formattedTotal})`
          : "❌ Customer email failed",
      );
    } catch (err: any) {
      console.error("❌ Customer Email EXCEPTION:", err?.message || err);
    }

    // ── 3. Owner Alert Email ──────────────────────────────────────────────────
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
      console.log(
        ownerEmailSent ? "✅ Owner email sent" : "❌ Owner email failed",
      );
    } catch (err: any) {
      console.error("❌ Owner Email EXCEPTION:", err?.message || err);
    }

    console.log(`📊 Results [${orderNumber}] order-placed:`, {
      country,
      currency: currencyCfg.code,
      formattedTotal,
      phone: customerPhone || "NOT PROVIDED",
      whatsapp: whatsappSent ? "✅ image+text" : "❌",
      customerEmail: customerEmailSent ? "✅" : "❌",
      ownerEmail: ownerEmailSent ? "✅" : "❌",
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
