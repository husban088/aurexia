// app/api/send-order-notification/route.ts
// FIX 1 — Actual results return karo (fire-and-forget band)
//          Page ko pata chalega email/whatsapp actually gayi ya nahi
// FIX 2 — Anti-spam headers + text version (Yahoo inbox fix)

import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmationEmail, sendOwnerOrderAlert } from "@/lib/email";
import { sendOrderWhatsApp } from "@/lib/whatsapp";

// Exchange rates — PKR se convert
const PKR_EXCHANGE_RATES: Record<string, number> = {
  PKR: 1,
  USD: 0.003584,
  GBP: 0.002817,
  EUR: 0.003289,
  AUD: 0.005384,
  CAD: 0.00488,
  AED: 0.013168,
  SAR: 0.013443,
  INR: 0.2987,
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
    } = body;

    // Validate
    if (!orderNumber || !email || !name || !items?.length) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const currencyCode: string = (currency || "PKR").toUpperCase();
    const currencySymbol = CURRENCY_SYMBOLS[currencyCode] ?? currencyCode;

    // Convert prices PKR → target currency
    const formattedItems = items.map((item: any) => {
      const pricePKR = item.pricePKR ?? item.price ?? 0;
      const convertedPrice = formatConvertedPrice(pricePKR, currencyCode);
      return {
        name: item.name ?? item.product_name ?? "Product",
        variant: item.variant ?? item.variant_name ?? null,
        quantity: item.quantity,
        formattedPrice: convertedPrice,
        pricePKR,
      };
    });

    const totalPKR = total ?? 0;
    const formattedTotal = formatConvertedPrice(totalPKR, currencyCode);
    const customerPhone = phone || "";

    console.log(
      `Sending notifications for order ${orderNumber} (${currencyCode})`,
    );

    // ── AWAIT actual results — fire-and-forget band karo ──────────────────────
    // Pehle "queued" return karta tha — isliye hamesha "Sent Successfully" dikhta tha
    // Ab actual true/false aayega — page sahi status dikhayega
    const [whatsappResult, customerEmailResult, ownerEmailResult] =
      await Promise.allSettled([
        // WhatsApp
        customerPhone
          ? sendOrderWhatsApp(
              customerPhone,
              orderNumber,
              name,
              totalPKR,
              items,
              formattedTotal,
              formattedItems,
            )
          : Promise.resolve(false),

        // Customer email — email.ts ka function (already anti-spam perfect)
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
        ),
      ]);

    // Actual results extract karo
    const whatsappSent =
      whatsappResult.status === "fulfilled" && whatsappResult.value === true;
    const customerEmailSent =
      customerEmailResult.status === "fulfilled" &&
      customerEmailResult.value === true;
    const ownerEmailSent =
      ownerEmailResult.status === "fulfilled" &&
      ownerEmailResult.value === true;

    console.log(`Notification results for ${orderNumber}:`, {
      whatsapp: whatsappSent ? "sent" : "failed",
      customerEmail: customerEmailSent ? "sent" : "failed",
      ownerEmail: ownerEmailSent ? "sent" : "failed",
    });

    // ── Actual results return karo page ko ───────────────────────────────────
    return NextResponse.json({
      success: true,
      results: {
        // page.tsx in fields ko check karta hai
        emailSent: customerEmailSent, // true/false — actual result
        whatsappSent: whatsappSent, // true/false — actual result
        ownerEmailSent: ownerEmailSent,
      },
    });
  } catch (error: any) {
    console.error("send-order-notification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
