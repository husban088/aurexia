// lib/whatsapp.ts
// ✅ GREEN API version — Next.js me perfectly kaam karta hai
// ✅ FIXED: International phone formatting for ALL countries
// Green API: https://green-api.com

// ============================================
// ✅ FIXED: PHONE NUMBER FORMATTER
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
  // The country code digits stay intact
  if (clean.startsWith("+")) {
    clean = clean.slice(1);
    // e.g. "+61412345678" → "61412345678" ✅
  }
  // Step 3: ONLY apply Pakistan local format fix
  // STRICT check: starts with "0" AND total is exactly 11 digits
  // AND remaining 10 digits start with "3" (Pakistani mobile prefix)
  // This prevents Australian "0412345678" (10 digits) from being misidentified
  else if (
    clean.startsWith("0") &&
    clean.length === 11 &&
    clean[1] === "3" // Pakistani mobile numbers always start with 03XX
  ) {
    clean = "92" + clean.slice(1);
    // e.g. "03001234567" → "923001234567" ✅
  }

  // Step 4: Green API chatId format
  const chatId = `${clean}@c.us`;
  console.log(`📱 Phone format: "${phoneNumber}" → chatId: "${chatId}"`);
  return chatId;
}

// ============================================
// CORE SEND FUNCTION — Green API
// ============================================
export async function sendWhatsAppMessage(
  to: string,
  message: string
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

  console.log(`📱 Sending WhatsApp to: ${to} → chatId: ${chatId}`);

  try {
    const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId: chatId,
        message: message,
      }),
    });

    const result = await response.json();

    if (response.ok && result.idMessage) {
      console.log("✅ WhatsApp sent successfully!");
      console.log(`   To: ${to} (chatId: ${chatId})`);
      console.log(`   Message ID: ${result.idMessage}`);
      return true;
    } else {
      console.error("❌ Green API error response:", JSON.stringify(result));
      return false;
    }
  } catch (error) {
    console.error("❌ WhatsApp network/fetch error:", error);
    return false;
  }
}

// ============================================
// ✅ FIXED: ORDER CONFIRMATION MESSAGE
// Now supports ALL currencies — not just PKR
// ============================================
export async function sendOrderWhatsApp(
  phoneNumber: string, // e.g. "+923001234567" or "+61412345678"
  orderNumber: string,
  name: string,
  total: number, // Raw PKR amount
  items: Array<{
    name: string;
    variant?: string;
    quantity: number;
    price: number; // PKR amount
    piecesPerUnit?: number;
  }>,
  // ✅ Optional: pass formatted price strings from frontend
  // so currency is already converted (e.g. "A$5.48" for Australia)
  formattedTotal?: string,
  formattedItems?: Array<{
    name: string;
    variant?: string;
    quantity: number;
    formattedPrice: string;
  }>
): Promise<boolean> {
  // ✅ Use pre-formatted prices if provided (from route.ts which has currency context)
  // Otherwise fall back to PKR
  const itemsList =
    formattedItems && formattedItems.length > 0
      ? formattedItems
          .map(
            (item) =>
              `• ${item.name}${item.variant ? ` (${item.variant})` : ""} x${
                item.quantity
              } — ${item.formattedPrice}`
          )
          .join("\n")
      : items
          .map(
            (item) =>
              `• ${item.name}${item.variant ? ` (${item.variant})` : ""} x${
                item.quantity
              } — PKR ${item.price.toLocaleString()}`
          )
          .join("\n");

  const displayTotal = formattedTotal || `PKR ${total.toLocaleString()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const message = `✅ Order Confirmed — Tech4U

Hello *${name}*! Thank you for your purchase 🎉

📦 Order Number: ${orderNumber}
💰 Total Amount: ${displayTotal}

🛒 Items Ordered:
${itemsList}

Your order is being processed and will be shipped soon. You'll receive tracking info here on WhatsApp once shipped.

For any questions:
📧 info@tech4ru.com
🌐 tech4ru.com

Thank you for choosing Tech4U! ✨`;

  return sendWhatsAppMessage(phoneNumber, message);
}
