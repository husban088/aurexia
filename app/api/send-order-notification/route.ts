// app/api/send-order-notification/route.ts
// ✅ COMPLETE — WhatsApp + Customer Email + Owner Email
// Resend API se — Gmail/Yahoo/Hotmail/info sab inbox mein ✅
// sendOrderConfirmationEmail + sendOwnerOrderAlert — dono use ho rahe hain

import { NextRequest, NextResponse } from "next/server";
import {
  sendOrderConfirmationEmail,
  sendOwnerOrderAlert,
} from "@/lib/email";
import { sendOrderWhatsApp } from "@/lib/whatsapp";

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

    // ─── Currency symbol ──────────────────────────────────────────────────────
    const currencyCode = currency || "PKR";
    const currencySymbol =
      currencyCode === "PKR" ? "PKR"
      : currencyCode === "USD" ? "$"
      : currencyCode === "GBP" ? "£"
      : currencyCode === "EUR" ? "€"
      : currencyCode === "AUD" ? "A$"
      : currencyCode === "AED" ? "AED"
      : currencyCode === "SAR" ? "SAR"
      : currencyCode === "INR" ? "₹"
      : currencyCode === "CAD" ? "C$"
      : currencyCode;

    // ─── Formatted items + total ──────────────────────────────────────────────
    const formattedItems = items.map((item: any) => ({
      name: item.name,
      variant: item.variant,
      quantity: item.quantity,
      formattedPrice: `${currencySymbol} ${Number(item.price).toLocaleString()}`,
    }));

    const formattedTotal = `${currencySymbol} ${Number(total).toLocaleString()}`;

    // ─── Customer phone for WhatsApp ──────────────────────────────────────────
    const customerPhone = phone || "";

    // ─── Run ALL notifications in parallel ────────────────────────────────────
    const [whatsappResult, customerEmailResult, ownerEmailResult] =
      await Promise.allSettled([

        // 1️⃣ WhatsApp → Customer
        customerPhone
          ? sendOrderWhatsApp(
              customerPhone,
              orderNumber,
              name,
              total,
              items,
              formattedTotal,
              formattedItems,
            )
          : Promise.resolve(false),

        // 2️⃣ Resend Email → Customer (Gmail/Yahoo/Hotmail/info sab inbox mein)
        sendOrderConfirmationEmail(
          email,
          orderNumber,
          name,
          items,
          total,
          shippingAddress || "",
          paymentMethod || "N/A",
          currencyCode,
          formattedTotal,
          formattedItems,
        ),

        // 3️⃣ Resend Email → Owner (saare OWNER_EMAILS pe)
        sendOwnerOrderAlert(
          orderNumber,
          name,
          email,
          customerPhone,
          items,
          total,
          shippingAddress || "",
          paymentMethod || "N/A",
          currencyCode,
          formattedTotal,
          formattedItems,
        ),
      ]);

    // ─── Results ──────────────────────────────────────────────────────────────
    const whatsappSent =
      whatsappResult.status === "fulfilled" && whatsappResult.value === true;
    const customerEmailSent =
      customerEmailResult.status === "fulfilled" &&
      customerEmailResult.value === true;
    const ownerEmailSent =
      ownerEmailResult.status === "fulfilled" &&
      ownerEmailResult.value === true;

    console.log("📊 Order Notification Results:", {
      orderNumber,
      whatsapp: whatsappSent ? "✅" : "❌",
      customerEmail: customerEmailSent ? "✅" : "❌",
      ownerEmail: ownerEmailSent ? "✅" : "❌",
    });

    return NextResponse.json({
      success: true,
      results: {
        whatsapp: whatsappSent,
        customerEmail: customerEmailSent,
        ownerEmail: ownerEmailSent,
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