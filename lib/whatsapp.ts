// lib/whatsapp.ts
// ✅ GREEN API version — Next.js me perfectly kaam karta hai
// Baileys remove kar diya — woh serverless me crash karta tha
// Green API: https://green-api.com (free account banao)

// ============================================
// PHONE NUMBER FORMATTER
// Sab countries handle karta hai:
// Pakistan (+92), UK (+44), USA (+1), Australia (+61)
// ============================================
function formatPhoneForWhatsApp(phoneNumber: string): string {
  // Sirf digits rakhein — +, spaces, dashes sab hata do
  let clean = phoneNumber.replace(/\D/g, "");

  // Agar local Pakistan format ho (03XX...) to 92 add karo
  if (clean.startsWith("0") && clean.length === 11) {
    clean = "92" + clean.slice(1);
  }

  // Green API format: number@c.us
  return `${clean}@c.us`;
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

  // Credentials check
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

  // Format the number for WhatsApp
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
      console.log(`   To: ${to}`);
      console.log(`   Message ID: ${result.idMessage}`);
      return true;
    } else {
      console.error("❌ Green API error response:", result);
      return false;
    }
  } catch (error) {
    console.error("❌ WhatsApp network/fetch error:", error);
    return false;
  }
}

// ============================================
// ORDER CONFIRMATION — WhatsApp pe bhejne ka message
// Pakistan, UK, USA, Australia — sab countries support
// ============================================
export async function sendOrderWhatsApp(
  phoneNumber: string, // e.g. "+923001234567" ya "+61412345678"
  orderNumber: string,
  name: string,
  total: number,
  items: Array<{
    name: string;
    variant?: string;
    quantity: number;
    price: number;
    piecesPerUnit?: number;
  }>
): Promise<boolean> {
  // Items list banana
  const itemsList = items
    .map(
      (item) =>
        `• ${item.name}${item.variant ? ` (${item.variant})` : ""} x${
          item.quantity
        } — PKR ${item.price.toLocaleString()}`
    )
    .join("\n");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const message = `🛍️ *TECH4U — Order Confirmed!*

Dear *${name}*,

✅ Aapka order successfully place ho gaya hai!

━━━━━━━━━━━━━━━━━━━━
📦 *Order #:* ${orderNumber}
💰 *Total:* PKR ${total.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━

🛒 *Items:*
${itemsList}

🔗 Track your order:
${appUrl}/orders/${orderNumber}

Shukriya Tech4U se shopping karne ka! ✨
Koi sawal ho to reply karein.`;

  return sendWhatsAppMessage(phoneNumber, message);
}
