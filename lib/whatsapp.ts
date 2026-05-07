// lib/whatsapp.ts
// ✅ GREEN API version — Next.js me perfectly kaam karta hai
// ✅ FIXED: International phone formatting for ALL countries
// ✅ NEW: Image support — cart ki pehli item ki image WhatsApp pe bhi jayegi
// Green API: https://green-api.com

// ============================================
// ✅ PHONE NUMBER FORMATTER
// Handles ALL countries correctly:
// "+923001234567" → "923001234567@c.us"  ✅ Pakistan (with code)
// "03001234567"   → "923001234567@c.us"  ✅ Pakistan (local format)
// "+61412345678"  → "61412345678@c.us"   ✅ Australia
// "+12125551234"  → "12125551234@c.us"   ✅ USA
// "+447123456789" → "447123456789@c.us"  ✅ UK
// "+971501234567" → "971501234567@c.us"  ✅ UAE
// "+966501234567" → "966501234567@c.us"  ✅ Saudi Arabia
// "+491512345678" → "491512345678@c.us"  ✅ Germany/Europe
// ============================================
function formatPhoneForWhatsApp(phoneNumber: string): string {
  // Step 1: Remove spaces, dashes, brackets, dots
  let clean = phoneNumber.replace(/[\s\-\(\)\.]/g, "");

  // Step 2: If starts with +, just remove the + sign
  if (clean.startsWith("+")) {
    clean = clean.slice(1);
  }
  // Step 3: Pakistan local format fix
  // STRICT: starts with "0", exactly 11 digits, second digit is "3"
  else if (clean.startsWith("0") && clean.length === 11 && clean[1] === "3") {
    clean = "92" + clean.slice(1);
  }

  const chatId = `${clean}@c.us`;
  console.log(`📱 Phone format: "${phoneNumber}" → chatId: "${chatId}"`);
  return chatId;
}

// ============================================
// HELPER: Check karo ke URL valid image hai
// Sirf http/https Cloudinary/CDN URLs support hote hain
// Green API local/localhost URLs support nahi karta
// ============================================
function isValidPublicImageUrl(url: string | null | undefined): boolean {
  if (!url || url === "null" || url === "") return false;
  // Must be http/https
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  // localhost URLs Green API nahi bhej sakta
  if (url.includes("localhost") || url.includes("127.0.0.1")) return false;
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
    console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.warn("⚠️  WHATSAPP NOT CONFIGURED");
    console.warn("    .env.local mein add karo:");
    console.warn("    GREEN_API_INSTANCE_ID=your_instance_id");
    console.warn("    GREEN_API_TOKEN=your_token");
    console.warn("    Free account: https://green-api.com");
    console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return false;
  }

  const chatId = formatPhoneForWhatsApp(to);
  console.log(`📱 Sending WhatsApp text to: ${to} → chatId: ${chatId}`);

  try {
    const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message }),
    });

    const result = await response.json();

    if (response.ok && result.idMessage) {
      console.log("✅ WhatsApp text sent!");
      console.log(`   To: ${to} | Message ID: ${result.idMessage}`);
      return true;
    } else {
      console.error("❌ Green API text error:", JSON.stringify(result));
      return false;
    }
  } catch (error) {
    console.error("❌ WhatsApp text fetch error:", error);
    return false;
  }
}

// ============================================
// ✅ NEW: IMAGE SEND — Green API sendFileByUrl
// Pehli item ki image WhatsApp pe bhejta hai
// Green API docs: sendFileByUrl endpoint
// ============================================
async function sendWhatsAppImage(
  to: string,
  imageUrl: string,
  caption: string,
): Promise<boolean> {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const apiToken = process.env.GREEN_API_TOKEN;

  if (!instanceId || !apiToken) return false;
  if (!isValidPublicImageUrl(imageUrl)) {
    console.warn("⚠️ Image URL invalid ya localhost — skipping image send");
    return false;
  }

  const chatId = formatPhoneForWhatsApp(to);
  console.log(`🖼️ Sending WhatsApp image to: ${chatId}`);
  console.log(`   Image URL: ${imageUrl}`);

  try {
    const url = `https://api.green-api.com/waInstance${instanceId}/sendFileByUrl/${apiToken}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId,
        urlFile: imageUrl, // Cloudinary ya koi bhi public image URL
        fileName: "order.jpg", // Green API ko file name chahiye
        caption, // Image ke neeche text (short caption)
      }),
    });

    const result = await response.json();

    if (response.ok && result.idMessage) {
      console.log("✅ WhatsApp image sent!");
      console.log(`   Image ID: ${result.idMessage}`);
      return true;
    } else {
      console.error("❌ Green API image error:", JSON.stringify(result));
      return false;
    }
  } catch (error) {
    console.error("❌ WhatsApp image fetch error:", error);
    return false;
  }
}

// ============================================
// ✅ UPDATED: ORDER CONFIRMATION
// Ab image bhi jaayegi pehle, phir full text message
// Flow:
//   1. Image bhejo (pehli item ki) — with short caption
//   2. Full order details text bhejo
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
    image?: string; // ✅ NEW: image URL (optional)
  }>,
  formattedTotal?: string,
  formattedItems?: Array<{
    name: string;
    variant?: string;
    quantity: number;
    formattedPrice: string;
  }>,
): Promise<boolean> {
  // ── Build items list text ──
  const itemsList =
    formattedItems && formattedItems.length > 0
      ? formattedItems
          .map(
            (item) =>
              `• ${item.name}${item.variant ? ` (${item.variant})` : ""} x${
                item.quantity
              } — ${item.formattedPrice}`,
          )
          .join("\n")
      : items
          .map(
            (item) =>
              `• ${item.name}${item.variant ? ` (${item.variant})` : ""} x${
                item.quantity
              } — PKR ${item.price.toLocaleString()}`,
          )
          .join("\n");

  const displayTotal = formattedTotal || `PKR ${total.toLocaleString()}`;

  // ── Full order details message ──
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

  // ── Step 1: Image bhejo (pehli item ki, agar valid URL hai) ──
  const firstItemWithImage = items.find((item) =>
    isValidPublicImageUrl(item.image),
  );

  if (firstItemWithImage?.image) {
    // Short caption image ke saath
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
      console.warn(
        "⚠️ Image send failed — continuing with text message anyway",
      );
    }

    // ✅ Small delay taake image aur text alag alag properly deliver hon
    await new Promise((resolve) => setTimeout(resolve, 800));
  } else {
    console.log("ℹ️ No valid image URL found — sending text only");
  }

  // ── Step 2: Full text message bhejo ──
  return sendWhatsAppMessage(phoneNumber, message);
}
