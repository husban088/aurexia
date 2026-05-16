// app/api/send-order-notification/route.ts
// ✅ FIX: customerCountry WhatsApp tak properly pass hota hai
// ✅ FIX: Currency conversion by customer country

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
      customerCountry, // ← customer ki country (e.g. "United Kingdom", "Australia")
    } = body;

    // Validate
    if (!orderNumber || !email || !name || !items?.length) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const currencyCode: string = (currency || "PKR").toUpperCase();

    // Convert prices PKR → target currency (email ke liye)
    const formattedItems = items.map((item: any) => {
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
    const country = customerCountry || "Pakistan"; // ← WhatsApp currency ke liye

    console.log(
      `📦 Order notification: ${orderNumber} | Country: ${country} | Currency: ${currencyCode}`,
    );

    const [whatsappResult, customerEmailResult, ownerEmailResult] =
      await Promise.allSettled([
        // ✅ WhatsApp — customerCountry pass karo for currency conversion
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
                price: item.pricePKR ?? item.price ?? 0,
                piecesPerUnit: item.piecesPerUnit ?? item.pieces_per_unit ?? 1,
                image:
                  item.image ??
                  item.variant_image ??
                  item.product_image ??
                  null,
              })),
              formattedTotal,
              formattedItems,
              country, // ← ✅ Country pass ho rahi hai currency detection ke liye
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

    const whatsappSent =
      whatsappResult.status === "fulfilled" && whatsappResult.value === true;
    const customerEmailSent =
      customerEmailResult.status === "fulfilled" &&
      customerEmailResult.value === true;
    const ownerEmailSent =
      ownerEmailResult.status === "fulfilled" &&
      ownerEmailResult.value === true;

    console.log(`📊 Results for ${orderNumber}:`, {
      country,
      currency: currencyCode,
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
    console.error("send-order-notification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
