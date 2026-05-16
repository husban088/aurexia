// app/api/send-order-notification/route.ts
// ✅ FIX 1: customerCountry properly WhatsApp tak pass hoti hai
// ✅ FIX 2: Currency conversion by customer country
// ✅ FIX 3: Detailed error logging — Vercel logs mein clearly dikhega kya fail hua
// ✅ FIX 4: pricePKR fallback chain improved

import { NextRequest, NextResponse } from "next/server";
import {
  sendOrderConfirmationEmail,
  sendOwnerOrderAlert,
} from "@/lib/email-smtp";
import { sendOrderWhatsApp } from "@/lib/whatsapp";

// Exchange rates — PKR se convert (email ke liye)
const PKR_EXCHANGE_RATES: Record<string, number> = {
  PKR: 1,
  USD: 0.003584,
  GBP: 0.002639,
  EUR: 0.003049,
  AUD: 0.005,
  CAD: 0.004878,
  AED: 0.013082,
  SAR: 0.013357,
  INR: 0.298507,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  PKR: "PKR",
  USD: "$",
  GBP: "£",
  EUR: "€",
  AUD: "A$",
  CAD: "C$",
  AED: "AED",
  SAR: "SAR",
  INR: "₹",
};

function convertFromPKR(pricePKR: number, targetCurrency: string): number {
  const rate = PKR_EXCHANGE_RATES[targetCurrency] ?? 1;
  const converted = pricePKR * rate;
  if (targetCurrency === "PKR") return Math.round(converted);
  return Math.round(converted * 100) / 100;
}

function formatConvertedPrice(pricePKR: number, currencyCode: string): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode] ?? currencyCode;
  const converted = convertFromPKR(pricePKR, currencyCode);
  if (currencyCode === "PKR" || currencyCode === "INR") {
    return `${symbol} ${converted.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `${symbol} ${converted.toLocaleString("en-US", {
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
      subtotal,
      shipping,
      total,
      shippingAddress,
      paymentMethod,
      currency,
      customerCountry, // ✅ FIX: page.tsx se ab ye aa raha hai
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

    // ── ENV variable check ────────────────────────────────────────────────────
    if (!process.env.WASENDER_API_KEY) {
      console.error("❌ WASENDER_API_KEY missing from environment variables!");
    }
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("❌ GMAIL_USER or GMAIL_APP_PASSWORD missing!");
    }

    const currencyCode: string = (currency || "PKR").toUpperCase();

    // ✅ FIX: customerCountry — WhatsApp currency ke liye (pehle ye missing tha!)
    // page.tsx ab phoneInfo.name bhejta hai yahan
    const country = customerCountry || "Pakistan";

    console.log(
      `📦 Order notification: ${orderNumber} | Country: "${country}" | Currency: ${currencyCode} | Phone: ${phone || "MISSING"} | Email: ${email}`,
    );

    // ── Convert prices PKR → target currency (email ke liye) ─────────────────
    const formattedItems = items.map((item: any) => {
      // ✅ pricePKR = line total (already qty multiplied from page.tsx)
      const pricePKR = item.pricePKR ?? item.price ?? 0;
      const convertedPrice = formatConvertedPrice(pricePKR, currencyCode);
      return {
        name: item.name ?? item.product_name ?? "Product",
        variant: item.variant ?? item.variant_name ?? null,
        quantity: item.quantity,
        formattedPrice: convertedPrice,
        pricePKR,
        image: item.image ?? item.variant_image ?? item.product_image ?? null,
      };
    });

    const totalPKR = total ?? 0;
    const formattedTotal = formatConvertedPrice(totalPKR, currencyCode);
    const customerPhone = phone || "";

    console.log(
      `💰 Total: ${totalPKR} PKR → ${formattedTotal} (${currencyCode})`,
    );
    console.log(`🛒 Items count: ${items.length}`);

    // ── Send all 3 notifications in parallel ─────────────────────────────────
    const [whatsappResult, customerEmailResult, ownerEmailResult] =
      await Promise.allSettled([
        // ✅ WhatsApp — customerCountry ab correctly pass ho raha hai
        customerPhone
          ? sendOrderWhatsApp(
              customerPhone,
              orderNumber,
              name,
              totalPKR,
              items.map((item: any) => ({
                name: item.name ?? item.product_name ?? "Product",
                variant: item.variant ?? item.variant_name ?? null,
                quantity: item.quantity,
                // ✅ price = per-unit price (whatsapp.ts qty se multiply karta hai)
                price: item.price ?? item.pricePKR ?? 0,
                piecesPerUnit: item.piecesPerUnit ?? item.pieces_per_unit ?? 1,
                image:
                  item.image ??
                  item.variant_image ??
                  item.product_image ??
                  null,
              })),
              formattedTotal,
              formattedItems,
              country, // ✅ FIX: ye ab "Australia", "United Kingdom" etc. hai, "Pakistan" nahi!
            )
          : Promise.resolve(false),

        // Customer email
        sendOrderConfirmationEmail(
          email,
          orderNumber,
          name,
          items,
          totalPKR,
          shippingAddress || "",
          paymentMethod || "N/A",
          currencyCode,
          formattedTotal,
          formattedItems,
          country,
        ),

        // Owner alert
        sendOwnerOrderAlert(
          orderNumber,
          name,
          email,
          customerPhone,
          items,
          totalPKR,
          shippingAddress || "",
          paymentMethod || "N/A",
          currencyCode,
          formattedTotal,
          formattedItems,
          country,
        ),
      ]);

    // ── Log results (Vercel logs mein clearly dikhega) ────────────────────────
    const whatsappSent =
      whatsappResult.status === "fulfilled" && whatsappResult.value === true;
    const customerEmailSent =
      customerEmailResult.status === "fulfilled" &&
      customerEmailResult.value === true;
    const ownerEmailSent =
      ownerEmailResult.status === "fulfilled" &&
      ownerEmailResult.value === true;

    // ✅ Detailed failure reasons log karo
    if (whatsappResult.status === "rejected") {
      console.error("❌ WhatsApp EXCEPTION:", whatsappResult.reason);
    } else if (!whatsappSent) {
      console.error(
        "❌ WhatsApp returned false — WasenderAPI session check karo!",
      );
      console.error(
        "   👉 https://wasenderapi.com/dashboard → Sessions → Reconnect",
      );
    }

    if (customerEmailResult.status === "rejected") {
      console.error("❌ Customer Email EXCEPTION:", customerEmailResult.reason);
    } else if (!customerEmailSent) {
      console.error(
        "❌ Customer Email returned false — Gmail SMTP check karo!",
      );
    }

    if (ownerEmailResult.status === "rejected") {
      console.error("❌ Owner Email EXCEPTION:", ownerEmailResult.reason);
    } else if (!ownerEmailSent) {
      console.error("❌ Owner Email returned false");
    }

    console.log(`📊 Results [${orderNumber}]:`, {
      country,
      currency: currencyCode,
      phone: customerPhone || "NOT PROVIDED",
      whatsapp: whatsappSent ? "✅ sent" : "❌ failed",
      customerEmail: customerEmailSent ? "✅ sent" : "❌ failed",
      ownerEmail: ownerEmailSent ? "✅ sent" : "❌ failed",
    });

    return NextResponse.json({
      success: true,
      results: {
        emailSent: customerEmailSent,
        whatsappSent: whatsappSent,
        ownerEmailSent: ownerEmailSent,
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
