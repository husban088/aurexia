// app/api/send-order-notification/route.ts
// ✅ FIXED: Currency properly converted in WhatsApp + Email
// ✅ customerCountry → formattedTotal + formattedItems always in customer's currency
// ✅ Items total correctly calculated (price = perUnit, piecesPerUnit = 1 from page.tsx)
// ✅ WhatsApp CONFIRMED: image + text in ONE message via sendConfirmedWhatsApp
// ✅ currencyNote "(approx.)" removed from WhatsApp messages

import { NextRequest, NextResponse } from "next/server";
import {
  sendOrderConfirmationEmail,
  sendOwnerOrderAlert,
} from "@/lib/email-smtp";
import { sendConfirmedWhatsApp } from "@/lib/whatsapp";

// ── Currency helpers ──────────────────────────────────────────────────────────
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

    // ── waItems for WhatsApp (includes image fields for sendImageThenText) ────
    const waItems = items.map((item: any) => ({
      name: item.name ?? item.product_name ?? "Product",
      variant: item.variant ?? item.variant_name ?? null,
      quantity: item.quantity ?? 1,
      price: item.price ?? 0,
      piecesPerUnit: item.piecesPerUnit ?? item.pieces_per_unit ?? 1,
      // ✅ image fields — sendConfirmedWhatsApp → sendImageThenText picks these
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
        // ✅ sendConfirmedWhatsApp → image + full text in ONE WhatsApp message
        whatsappSent = await sendConfirmedWhatsApp(
          customerPhone,
          name,
          orderNumber,
          formattedTotal,  // e.g. "A$8.25"
          waItems,
          country,         // e.g. "Australia"
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