// lib/whatsapp.ts
// ✅ WASENDERAPI — WhatsApp for ALL Countries
// UK +44, USA +1, Australia +61, Pakistan +92 — sab kaam karta hai
// NO sandbox, NO join message, NO daily limit
// Unlimited messages — $6/month
// Docs: https://wasenderapi.com/api-docs

// ============================================
// PHONE NUMBER FORMATTER — ALL COUNTRIES
// E.164 format required: +[country][number]
//
// +61426855997  → +61426855997  ✅ Australia
// +12125551234  → +12125551234  ✅ USA
// +447123456789 → +447123456789 ✅ UK
// +923001234567 → +923001234567 ✅ Pakistan (international)
// 03001234567   → +923001234567 ✅ Pakistan (local 0-format)
// +971501234567 → +971501234567 ✅ UAE
// ============================================
export function formatPhoneForWhatsApp(phoneNumber: string): string {
  let clean = phoneNumber.trim().replace(/[\s\-\(\)\.]/g, "");

  if (clean.startsWith("+")) {
    clean = "+" + clean.slice(1).replace(/\D/g, "");
    return clean;
  } else if (clean.startsWith("0") && clean.length === 11 && clean[1] === "3") {
    // Pakistan local: 03001234567 → +923001234567
    clean = clean.replace(/\D/g, "");
    return `+92${clean.slice(1)}`;
  } else {
    clean = clean.replace(/\D/g, "");
    return `+${clean}`;
  }
}

// ============================================
// HELPER: Valid public image URL
// ============================================
function isValidPublicImageUrl(url: string | null | undefined): boolean {
  if (!url || url === "null" || url === "undefined" || url.trim() === "")
    return false;
  if (!url.startsWith("https://")) return false;
  if (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("0.0.0.0")
  )
    return false;
  return true;
}

// ============================================
// WASENDERAPI — Send Text Message
// POST /api/send-message
// ============================================
export async function sendWhatsAppMessage(
  to: string,
  message: string,
): Promise<boolean> {
  const apiKey = process.env.WASENDER_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ WASENDER_API_KEY missing — Add to .env.local");
    return false;
  }

  const toFormatted = formatPhoneForWhatsApp(to);
  console.log(`📱 WasenderAPI text → ${toFormatted}`);

  try {
    const response = await fetch(
      "https://www.wasenderapi.com/api/send-message",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: toFormatted,
          text: message,
        }),
      },
    );

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(
        `✅ WasenderAPI text sent! MsgID: ${result.data?.msgId} → ${toFormatted}`,
      );
      return true;
    } else {
      console.error(
        `❌ WasenderAPI text error (${toFormatted}):`,
        JSON.stringify(result),
      );
      return false;
    }
  } catch (error) {
    console.error(`❌ WasenderAPI fetch error (${toFormatted}):`, error);
    return false;
  }
}

// ============================================
// WASENDERAPI — Send Image with Caption
// POST /api/send-message (imageUrl parameter)
// ⚠️ PAID PLAN ONLY — uncomment when upgraded
// ============================================
export async function sendWhatsAppImage(
  to: string,
  imageUrl: string,
  caption: string,
): Promise<boolean> {
  const apiKey = process.env.WASENDER_API_KEY;

  if (!apiKey) return false;

  if (!isValidPublicImageUrl(imageUrl)) {
    console.warn(`⚠️ Invalid image URL — must be public https: ${imageUrl}`);
    return false;
  }

  const toFormatted = formatPhoneForWhatsApp(to);
  console.log(`🖼️ WasenderAPI image → ${toFormatted}`);
  console.log(`   Image: ${imageUrl}`);

  try {
    const response = await fetch(
      "https://www.wasenderapi.com/api/send-message",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: toFormatted,
          text: caption,
          imageUrl: imageUrl,
        }),
      },
    );

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`✅ WasenderAPI image sent! MsgID: ${result.data?.msgId}`);
      return true;
    } else {
      console.error(
        `❌ WasenderAPI image error (${toFormatted}):`,
        JSON.stringify(result),
      );
      return false;
    }
  } catch (error) {
    console.error(`❌ WasenderAPI image fetch error:`, error);
    return false;
  }
}

// ============================================
// COMPLETE ORDER NOTIFICATION
// FREE TRIAL MODE: Sirf text message
// PAID PLAN: Image + text dono (uncomment below)
// ============================================
export async function sendOrderWhatsApp(
  phoneNumber: string,
  orderNumber: string,
  name: string,
  total: number,
  items: Array<{
    name: string;
    variant?: string;
    quantity: number;
    price: number;
    piecesPerUnit?: number;
    image?: string;
  }>,
  formattedTotal?: string,
  formattedItems?: Array<{
    name: string;
    variant?: string;
    quantity: number;
    formattedPrice: string;
  }>,
): Promise<boolean> {
  // Build items list
  const itemsList =
    formattedItems && formattedItems.length > 0
      ? formattedItems
          .map(
            (item) =>
              `• ${item.name}${item.variant ? ` (${item.variant})` : ""} x${item.quantity} — ${item.formattedPrice}`,
          )
          .join("\n")
      : items
          .map(
            (item) =>
              `• ${item.name}${item.variant ? ` (${item.variant})` : ""} x${item.quantity} — PKR ${item.price.toLocaleString()}`,
          )
          .join("\n");

  const displayTotal = formattedTotal || `PKR ${total.toLocaleString()}`;

  const message = `✅ *Order Confirmed — Tech4U* 🎉

Hello *${name}*! Thank you for your purchase!

━━━━━━━━━━━━━━━━━
📦 *Order Number:* ${orderNumber}
💰 *Total Amount:* ${displayTotal}
━━━━━━━━━━━━━━━━━

🛒 *Items Ordered:*
${itemsList}

━━━━━━━━━━━━━━━━━
🚚 Shipping: FREE
━━━━━━━━━━━━━━━━━

Your order is being processed and will be shipped soon.
You'll receive tracking info here on WhatsApp once shipped.

For any questions:
📧 info@tech4ru.com
🌐 tech4ru.com

Thank you for choosing Tech4U! ✨`;

  // ============================================
  // 🆓 FREE TRIAL MODE — Sirf text jayega
  // Image disabled — rate limit se bachne ke liye
  // ============================================
  console.log("📱 Sending order text (FREE TRIAL MODE — image disabled)");
  return sendWhatsAppMessage(phoneNumber, message);

  // ============================================
  // 💰 PAID PLAN — Uncomment karo jab upgrade karo
  // Image + text dono jayenge
  // ============================================
  // const firstItemWithImage = items.find((item) =>
  //   isValidPublicImageUrl(item.image),
  // );
  // if (firstItemWithImage?.image) {
  //   const imageCaption = `🛍️ *${firstItemWithImage.name}*${
  //     firstItemWithImage.variant ? ` (${firstItemWithImage.variant})` : ""
  //   }\n📦 Order #${orderNumber} — Tech4U`;
  //   console.log("🖼️ Sending order image first...");
  //   const imageSent = await sendWhatsAppImage(
  //     phoneNumber,
  //     firstItemWithImage.image,
  //     imageCaption,
  //   );
  //   if (!imageSent) {
  //     console.warn("⚠️ Image send failed — continuing with text only");
  //   }
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  // }
  // return sendWhatsAppMessage(phoneNumber, message);
}
