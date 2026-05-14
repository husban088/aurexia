// app/api/send-order-notification/route.ts
// ✅ FIXED — Currency conversion sahi se ho rahi hai
// 1500 PKR → $5.38 USD | £4.23 GBP | A$8.07 AUD — sab sahi convert hoga

import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmationEmail, sendOwnerOrderAlert } from "@/lib/email";
import { sendOrderWhatsApp } from "@/lib/whatsapp";

// ─────────────────────────────────────────────────────────────────────────────
// EXCHANGE RATES — PKR se convert karna hai
// Yeh rates approximate hain — real-time ke liye .env mein API key add karo
// ─────────────────────────────────────────────────────────────────────────────
const PKR_EXCHANGE_RATES: Record<string, number> = {
  PKR: 1, // No conversion
  USD: 0.003584, // 1 PKR = 0.003584 USD  (1 USD ≈ 279 PKR)
  GBP: 0.002817, // 1 PKR = 0.002817 GBP  (1 GBP ≈ 355 PKR)
  EUR: 0.003289, // 1 PKR = 0.003289 EUR  (1 EUR ≈ 304 PKR)
  AUD: 0.005384, // 1 PKR = 0.005384 AUD  (1 AUD ≈ 186 PKR)
  CAD: 0.00488, // 1 PKR = 0.004880 CAD  (1 CAD ≈ 205 PKR)
  AED: 0.013168, // 1 PKR = 0.013168 AED  (1 AED ≈ 76 PKR)
  SAR: 0.013443, // 1 PKR = 0.013443 SAR  (1 SAR ≈ 74 PKR)
  INR: 0.2987, // 1 PKR = 0.2987 INR    (1 INR ≈ 3.35 PKR)
  CAD: 0.00488,
};

// Currency symbol map
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

// ─────────────────────────────────────────────────────────────────────────────
// CORE CONVERSION FUNCTION
// pricePKR: original price in PKR
// targetCurrency: "USD", "GBP", "AUD", etc.
// Returns: converted price number
// ─────────────────────────────────────────────────────────────────────────────
function convertFromPKR(pricePKR: number, targetCurrency: string): number {
  const rate = PKR_EXCHANGE_RATES[targetCurrency] ?? 1;
  const converted = pricePKR * rate;

  // PKR → round to whole number
  // USD/GBP/EUR/AUD → 2 decimal places
  if (targetCurrency === "PKR") {
    return Math.round(converted);
  }
  return Math.round(converted * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT PRICE — with currency symbol + proper decimals
// ─────────────────────────────────────────────────────────────────────────────
function formatConvertedPrice(pricePKR: number, currencyCode: string): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode] ?? currencyCode;
  const converted = convertFromPKR(pricePKR, currencyCode);

  if (currencyCode === "PKR" || currencyCode === "INR") {
    // No decimals for PKR and INR
    return `${symbol} ${converted.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }

  // 2 decimal places for USD, GBP, EUR, AUD, etc.
  return `${symbol} ${converted.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND: Send all notifications
// ─────────────────────────────────────────────────────────────────────────────
async function sendAllNotificationsBackground(data: {
  orderNumber: string;
  email: string;
  phone: string;
  name: string;
  items: any[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: string;
  paymentMethod: string;
  currencyCode: string;
  currencySymbol: string;
  formattedItems: any[];
  formattedTotal: string;
}) {
  const {
    orderNumber,
    email,
    phone,
    name,
    items,
    total,
    shippingAddress,
    paymentMethod,
    currencyCode,
    formattedTotal,
    formattedItems,
  } = data;

  const [whatsappResult, customerEmailResult, ownerEmailResult] =
    await Promise.allSettled([
      // 1️⃣ WhatsApp → Customer
      phone
        ? sendOrderWhatsApp(
            phone,
            orderNumber,
            name,
            total,
            items,
            formattedTotal,
            formattedItems,
          )
        : Promise.resolve(false),

      // 2️⃣ Email → Customer
      sendOrderConfirmationEmail(
        email,
        orderNumber,
        name,
        items,
        total,
        shippingAddress,
        paymentMethod,
        currencyCode,
        formattedTotal,
        formattedItems,
      ),

      // 3️⃣ Email → Owner
      sendOwnerOrderAlert(
        orderNumber,
        name,
        email,
        phone,
        items,
        total,
        shippingAddress,
        paymentMethod,
        currencyCode,
        formattedTotal,
        formattedItems,
      ),
    ]);

  console.log("📊 Background Notification Results:", {
    orderNumber,
    whatsapp:
      whatsappResult.status === "fulfilled" && whatsappResult.value
        ? "✅"
        : "❌",
    customerEmail:
      customerEmailResult.status === "fulfilled" && customerEmailResult.value
        ? "✅"
        : "❌",
    ownerEmail:
      ownerEmailResult.status === "fulfilled" && ownerEmailResult.value
        ? "✅"
        : "❌",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/send-order-notification
// ─────────────────────────────────────────────────────────────────────────────
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

    // ─── Validate required fields ─────────────────────────────────────────────
    if (!orderNumber || !email || !name || !items?.length) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // ─── Currency setup ───────────────────────────────────────────────────────
    const currencyCode: string = (currency || "PKR").toUpperCase();
    const currencySymbol = CURRENCY_SYMBOLS[currencyCode] ?? currencyCode;

    // ─── ✅ KEY FIX: Convert prices from PKR to target currency ───────────────
    // items mein pricePKR field hai (checkout page se aata hai)
    // Agar pricePKR nahi hai toh price field ko PKR maan lo
    const formattedItems = items.map((item: any) => {
      // pricePKR checkout page ne set kiya tha — yeh original PKR amount hai
      const pricePKR = item.pricePKR ?? item.price ?? 0;

      // ✅ Convert PKR → target currency
      const convertedPrice = formatConvertedPrice(pricePKR, currencyCode);

      return {
        name: item.name ?? item.product_name ?? "Product",
        variant: item.variant ?? item.variant_name ?? null,
        quantity: item.quantity,
        formattedPrice: convertedPrice, // ✅ Converted price — sahi currency mein
        pricePKR, // Keep original for reference
      };
    });

    // ─── ✅ Convert total from PKR to target currency ──────────────────────────
    // total bhi PKR mein aata hai checkout se
    const totalPKR = total ?? 0;
    const formattedTotal = formatConvertedPrice(totalPKR, currencyCode);

    const customerPhone = phone || "";

    // Log conversion for debugging
    console.log(`💱 Currency Conversion: PKR → ${currencyCode}`);
    console.log(`   Total: PKR ${totalPKR} → ${formattedTotal}`);
    if (items.length > 0) {
      const firstPKR = items[0].pricePKR ?? items[0].price ?? 0;
      console.log(
        `   First item: PKR ${firstPKR} → ${formatConvertedPrice(firstPKR, currencyCode)}`,
      );
    }

    // ─── Fire-and-forget background notifications ─────────────────────────────
    sendAllNotificationsBackground({
      orderNumber,
      email,
      phone: customerPhone,
      name,
      items,
      subtotal: subtotal ?? 0,
      shipping: shipping ?? 0,
      total: totalPKR,
      shippingAddress: shippingAddress || "",
      paymentMethod: paymentMethod || "N/A",
      currencyCode,
      currencySymbol,
      formattedItems,
      formattedTotal,
    }).catch((err) => {
      console.error("❌ Background notification error:", err);
    });

    console.log(
      `✅ Order ${orderNumber} — notifications queued (${currencyCode})`,
    );

    return NextResponse.json({
      success: true,
      message: "Order received! Notifications sending in background.",
      results: {
        whatsapp: "queued",
        customerEmail: "queued",
        ownerEmail: "queued",
      },
    });
  } catch (error: any) {
    console.error("❌ send-order-notification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
