// lib/whatsapp.ts
// ✅ COMPLETE FIX:
// 1. ALL countries WhatsApp delivery fixed (Australia +61, UK +44, USA +1, Pakistan +92)
// 2. Image send via Green API sendFileByUrl — properly working
// 3. Phone formatter handles ALL formats correctly
// Green API: https://green-api.com

// ============================================
// ✅ PHONE NUMBER FORMATTER — ALL COUNTRIES
//
// Rule: Strip everything except digits, then add @c.us
// +61426855997  → 61426855997@c.us  ✅ Australia
// +12125551234  → 12125551234@c.us  ✅ USA
// +447123456789 → 447123456789@c.us ✅ UK
// +923001234567 → 923001234567@c.us ✅ Pakistan (international)
// 03001234567   → 923001234567@c.us ✅ Pakistan (local 0-format only)
// +971501234567 → 971501234567@c.us ✅ UAE
// +966501234567 → 966501234567@c.us ✅ Saudi Arabia
// ============================================
export function formatPhoneForWhatsApp(phoneNumber: string): string {
  let clean = phoneNumber.trim().replace(/[\s\-\(\)\.]/g, "");

  if (clean.startsWith("+")) {
    // Remove only the '+' — keep all digits (works for ALL countries)
    clean = clean.slice(1);
  } else if (clean.startsWith("0") && clean.length === 11 && clean[1] === "3") {
    // Pakistan local format ONLY: 03001234567 → 923001234567
    clean = "92" + clean.slice(1);
  }

  // Remove any remaining non-digits
  clean = clean.replace(/\D/g, "");

  const chatId = `${clean}@c.us`;
  console.log(`📱 Phone → chatId: "${phoneNumber}" → "${chatId}"`);
  return chatId;
}

// ============================================
// HELPER: Valid public image URL check
// ============================================
function isValidPublicImageUrl(url: string | null | undefined): boolean {
  if (!url || url === "null" || url === "undefined" || url.trim() === "")
    return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  if (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("0.0.0.0")
  )
    return false;
  return true;
}

// ============================================
// CORE TEXT SEND — Green API sendMessage
// ============================================
export async function sendWhatsAppMessage(
  to: string,
  message: string,
): Promise<boolean> {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const apiToken = process.env.GREEN_API_TOKEN;

  if (!instanceId || !apiToken) {
    console.warn("⚠️  WHATSAPP NOT CONFIGURED — Add GREEN_API_* to .env.local");
    return false;
  }

  const chatId = formatPhoneForWhatsApp(to);
  console.log(`📱 Sending WhatsApp text → chatId: ${chatId}`);

  try {
    const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message }),
    });
    const result = await response.json();
    if (response.ok && result.idMessage) {
      console.log(`✅ WhatsApp text sent! ID: ${result.idMessage} → ${chatId}`);
      return true;
    } else {
      console.error(
        `❌ Green API text error (${chatId}):`,
        JSON.stringify(result),
      );
      return false;
    }
  } catch (error) {
    console.error(`❌ WhatsApp text fetch error (${chatId}):`, error);
    return false;
  }
}

// ============================================
// IMAGE SEND — Green API sendFileByUrl
// ============================================
export async function sendWhatsAppImage(
  to: string,
  imageUrl: string,
  caption: string,
): Promise<boolean> {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const apiToken = process.env.GREEN_API_TOKEN;

  if (!instanceId || !apiToken) return false;
  if (!isValidPublicImageUrl(imageUrl)) {
    console.warn(
      `⚠️ Invalid image URL — must be public https URL: ${imageUrl}`,
    );
    return false;
  }

  const chatId = formatPhoneForWhatsApp(to);
  console.log(`🖼️ Sending WhatsApp image → chatId: ${chatId}`);
  console.log(`   Image: ${imageUrl}`);

  try {
    const url = `https://api.green-api.com/waInstance${instanceId}/sendFileByUrl/${apiToken}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId,
        urlFile: imageUrl,
        fileName: "product.jpg",
        caption,
      }),
    });
    const result = await response.json();
    if (response.ok && result.idMessage) {
      console.log(`✅ WhatsApp image sent! ID: ${result.idMessage}`);
      return true;
    } else {
      console.error(
        `❌ Green API image error (${chatId}):`,
        JSON.stringify(result),
      );
      return false;
    }
  } catch (error) {
    console.error(`❌ WhatsApp image fetch error (${chatId}):`, error);
    return false;
  }
}

// ============================================
// COMPLETE ORDER NOTIFICATION
// Flow: Image → wait 1s → Full text
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

  // Step 1: Image bhejo
  const firstItemWithImage = items.find((item) =>
    isValidPublicImageUrl(item.image),
  );

  if (firstItemWithImage?.image) {
    const imageCaption = `🛍️ *${firstItemWithImage.name}*${
      firstItemWithImage.variant ? ` (${firstItemWithImage.variant})` : ""
    }\n📦 Order #${orderNumber} — Tech4U`;

    console.log("🖼️ Sending order image first...");
    const imageSent = await sendWhatsAppImage(
      phoneNumber,
      firstItemWithImage.image,
      imageCaption,
    );
    if (!imageSent) {
      console.warn("⚠️ Image send failed — continuing with text message");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } else {
    console.log("ℹ️ No valid public image URL — sending text only");
  }

  // Step 2: Text bhejo
  return sendWhatsAppMessage(phoneNumber, message);
}
