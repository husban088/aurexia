// lib/whatsapp.ts
// ✅ WASENDERAPI — PAID PLAN ACTIVE
// ✅ WhatsApp messages email ke bilkul same content/structure
// ✅ Currency auto-detect by customer country
// ✅ Product image + text (paid plan) — ALL statuses: confirmed, shipped, delivered, cancelled
// Docs: https://wasenderapi.com/api-docs

// ─────────────────────────────────────────────────────────────
// CURRENCY CONFIG — exactly matching email.ts PKR_RATES
// ─────────────────────────────────────────────────────────────
const PKR_RATES: Record<
  string,
  { symbol: string; rate: number; code: string; locale: string }
> = {
  Pakistan: { symbol: "₨", rate: 1, code: "PKR", locale: "en-PK" },
  "United States": { symbol: "$", rate: 0.0036, code: "USD", locale: "en-US" },
  USA: { symbol: "$", rate: 0.0036, code: "USD", locale: "en-US" },
  US: { symbol: "$", rate: 0.0036, code: "USD", locale: "en-US" },
  "United Kingdom": { symbol: "£", rate: 0.0028, code: "GBP", locale: "en-GB" },
  UK: { symbol: "£", rate: 0.0028, code: "GBP", locale: "en-GB" },
  GB: { symbol: "£", rate: 0.0028, code: "GBP", locale: "en-GB" },
  England: { symbol: "£", rate: 0.0028, code: "GBP", locale: "en-GB" },
  Australia: { symbol: "A$", rate: 0.0055, code: "AUD", locale: "en-AU" },
  AU: { symbol: "A$", rate: 0.0055, code: "AUD", locale: "en-AU" },
  Canada: { symbol: "C$", rate: 0.0049, code: "CAD", locale: "en-CA" },
  CA: { symbol: "C$", rate: 0.0049, code: "CAD", locale: "en-CA" },
  "United Arab Emirates": {
    symbol: "AED",
    rate: 0.013,
    code: "AED",
    locale: "ar-AE",
  },
  UAE: { symbol: "AED", rate: 0.013, code: "AED", locale: "ar-AE" },
  AE: { symbol: "AED", rate: 0.013, code: "AED", locale: "ar-AE" },
  Dubai: { symbol: "AED", rate: 0.013, code: "AED", locale: "ar-AE" },
  "Saudi Arabia": { symbol: "﷼", rate: 0.013, code: "SAR", locale: "ar-SA" },
  SA: { symbol: "﷼", rate: 0.013, code: "SAR", locale: "ar-SA" },
  KSA: { symbol: "﷼", rate: 0.013, code: "SAR", locale: "ar-SA" },
  India: { symbol: "₹", rate: 0.3, code: "INR", locale: "en-IN" },
  IN: { symbol: "₹", rate: 0.3, code: "INR", locale: "en-IN" },
  Germany: { symbol: "€", rate: 0.0033, code: "EUR", locale: "de-DE" },
  France: { symbol: "€", rate: 0.0033, code: "EUR", locale: "fr-FR" },
  Italy: { symbol: "€", rate: 0.0033, code: "EUR", locale: "it-IT" },
  Spain: { symbol: "€", rate: 0.0033, code: "EUR", locale: "es-ES" },
  Netherlands: { symbol: "€", rate: 0.0033, code: "EUR", locale: "nl-NL" },
  EU: { symbol: "€", rate: 0.0033, code: "EUR", locale: "en-EU" },
};

function getCurrencyConfig(country: string) {
  if (!country) return PKR_RATES["Pakistan"];
  if (PKR_RATES[country]) return PKR_RATES[country];
  const lower = country.toLowerCase();
  for (const [key, val] of Object.entries(PKR_RATES)) {
    if (key.toLowerCase() === lower) return val;
  }
  for (const [key, val] of Object.entries(PKR_RATES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower))
      return val;
  }
  return PKR_RATES["Pakistan"];
}

function formatPrice(amountPKR: number, country: string): string {
  const cfg = getCurrencyConfig(country);
  if (cfg.code === "PKR") {
    return `₨ ${Math.round(amountPKR).toLocaleString("en-PK")}`;
  }
  const converted = amountPKR * cfg.rate;
  if (cfg.code === "INR") {
    return `₹${Math.round(converted).toLocaleString("en-IN")}`;
  }
  return `${cfg.symbol}${converted.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─────────────────────────────────────────────────────────────
// PHONE NUMBER FORMATTER — ALL COUNTRIES (E.164)
// ─────────────────────────────────────────────────────────────
export function formatPhoneForWhatsApp(phoneNumber: string): string {
  let clean = phoneNumber.trim().replace(/[\s\-\(\)\.]/g, "");
  if (clean.startsWith("+")) {
    return "+" + clean.slice(1).replace(/\D/g, "");
  } else if (clean.startsWith("0") && clean.length === 11 && clean[1] === "3") {
    return `+92${clean.replace(/\D/g, "").slice(1)}`;
  } else {
    return `+${clean.replace(/\D/g, "")}`;
  }
}

// ─────────────────────────────────────────────────────────────
// IMAGE URL VALIDATOR
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// PICK BEST IMAGE from item (variant_image > image > product_image)
// ─────────────────────────────────────────────────────────────
function pickItemImage(item: {
  variant_image?: string | null;
  image?: string | null;
  product_image?: string | null;
}): string | null {
  const url = item.variant_image || item.image || item.product_image || null;
  return isValidPublicImageUrl(url) ? url : null;
}

// ─────────────────────────────────────────────────────────────
// CORE: Send Text Message
// ─────────────────────────────────────────────────────────────
export async function sendWhatsAppMessage(
  to: string,
  message: string,
): Promise<boolean> {
  const apiKey = process.env.WASENDER_API_KEY;
  if (!apiKey) {
    console.error("❌ WASENDER_API_KEY missing — .env.local mein add karo");
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
        body: JSON.stringify({ to: toFormatted, text: message }),
      },
    );

    const result = await response.json();
    console.log(
      `📥 WasenderAPI response (${response.status}):`,
      JSON.stringify(result),
    );

    if (response.ok && result.success) {
      console.log(
        `✅ WasenderAPI text sent! MsgID: ${result.data?.msgId} → ${toFormatted}`,
      );
      return true;
    } else {
      console.error(
        `❌ WasenderAPI FAILED (${response.status}) → ${toFormatted}:`,
        JSON.stringify(result),
      );
      if (response.status === 403) {
        console.error("⚠️  403 SESSION DISCONNECT!");
        console.error(
          "   👉 https://wasenderapi.com/dashboard → Sessions → Reconnect WhatsApp",
        );
      }
      if (response.status === 401) {
        console.error(
          "⚠️  401 INVALID API KEY — Dashboard se sahi key copy karo",
        );
      }
      return false;
    }
  } catch (error) {
    console.error(`❌ WasenderAPI fetch exception (${toFormatted}):`, error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// CORE: Send Image with Caption (PAID PLAN ✅)
// ─────────────────────────────────────────────────────────────
export async function sendWhatsAppImage(
  to: string,
  imageUrl: string,
  caption: string,
): Promise<boolean> {
  const apiKey = process.env.WASENDER_API_KEY;
  if (!apiKey) return false;

  if (!isValidPublicImageUrl(imageUrl)) {
    console.warn(`⚠️ Invalid/localhost image URL — skipping: ${imageUrl}`);
    return false;
  }

  const toFormatted = formatPhoneForWhatsApp(to);
  console.log(`🖼️ WasenderAPI image → ${toFormatted}`);

  try {
    const response = await fetch(
      "https://www.wasenderapi.com/api/send-message",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to: toFormatted, text: caption, imageUrl }),
      },
    );

    const result = await response.json();
    console.log(
      `📥 WasenderAPI image response (${response.status}):`,
      JSON.stringify(result),
    );

    if (response.ok && result.success) {
      console.log(`✅ WasenderAPI image sent! MsgID: ${result.data?.msgId}`);
      return true;
    } else {
      console.error(
        `❌ WasenderAPI image FAILED (${response.status}):`,
        JSON.stringify(result),
      );
      return false;
    }
  } catch (error) {
    console.error(`❌ WasenderAPI image exception:`, error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// HELPER: Send image + text in ONE SINGLE MESSAGE (paid plan)
// ✅ imageUrl + text = ek hi WhatsApp message, alag nahi
// ✅ Agar image nahi mili to sirf text message jata hai
// Used by ALL status notifications (confirmed, shipped, delivered, cancelled)
// ─────────────────────────────────────────────────────────────
async function sendImageThenText(
  phoneNumber: string,
  textMessage: string,
  items: Array<{
    name: string;
    variant?: string | null;
    variant_image?: string | null;
    image?: string | null;
    product_image?: string | null;
  }>,
  orderNumber: string,
  statusLabel: string,
): Promise<boolean> {
  const apiKey = process.env.WASENDER_API_KEY;
  if (!apiKey) {
    console.error("❌ WASENDER_API_KEY missing");
    return false;
  }

  const toFormatted = formatPhoneForWhatsApp(phoneNumber);

  // Find first item with a valid public image
  const firstItemWithImage = items.find((item) => pickItemImage(item) !== null);
  const imageUrl = firstItemWithImage
    ? pickItemImage(firstItemWithImage)
    : null;

  if (imageUrl) {
    // ✅ EK HI API CALL — imageUrl + text saath mein = ek WhatsApp message
    console.log(
      `🖼️ WasenderAPI image+text (single msg) → ${toFormatted} [${statusLabel}]`,
    );
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
            imageUrl, // ✅ image
            text: textMessage, // ✅ full order text as caption in same message
          }),
        },
      );

      const result = await response.json();
      console.log(
        `📥 WasenderAPI image+text response (${response.status}):`,
        JSON.stringify(result),
      );

      if (response.ok && result.success) {
        console.log(
          `✅ Single image+text message sent! MsgID: ${result.data?.msgId} → ${toFormatted}`,
        );
        return true;
      } else {
        console.error(
          `❌ image+text FAILED (${response.status}):`,
          JSON.stringify(result),
        );
        // Fallback: try text-only if image+text fails
        console.warn("⚠️ Falling back to text-only message...");
        return sendWhatsAppMessage(phoneNumber, textMessage);
      }
    } catch (error) {
      console.error(`❌ image+text exception:`, error);
      // Fallback: try text-only
      return sendWhatsAppMessage(phoneNumber, textMessage);
    }
  } else {
    // No image available — send text only
    console.log(`ℹ️ No product image for ${statusLabel} — sending text only`);
    return sendWhatsAppMessage(phoneNumber, textMessage);
  }
}

// ─────────────────────────────────────────────────────────────
// ORDER CONFIRMATION WhatsApp
// ✅ Matches email.ts sendOrderConfirmationEmail exactly
// ✅ PAID PLAN: Image + Text
// ✅ Currency by customer country
// ─────────────────────────────────────────────────────────────
export async function sendOrderWhatsApp(
  phoneNumber: string,
  orderNumber: string,
  name: string,
  total: number, // always PKR
  items: Array<{
    name: string;
    variant?: string | null;
    quantity: number;
    price: number; // PKR
    piecesPerUnit?: number;
    image?: string | null;
    variant_image?: string | null;
    product_image?: string | null;
  }>,
  formattedTotal?: string,
  formattedItems?: Array<{
    name: string;
    variant?: string | null;
    quantity: number;
    formattedPrice: string;
  }>,
  customerCountry?: string,
): Promise<boolean> {
  const country = customerCountry || "Pakistan";
  const cfg = getCurrencyConfig(country);
  const isPKR = cfg.code === "PKR";

  console.log(`🌍 Country: "${country}" → Currency: ${cfg.code}`);

  let itemLines: string[] = [];
  let totalPKRCalc = 0;

  for (const item of items) {
    const ppu = item.piecesPerUnit || 1;
    const itemTotalPKR = item.price * ppu * item.quantity;
    totalPKRCalc += itemTotalPKR;
    const priceFormatted = formatPrice(itemTotalPKR, country);
    const variantText =
      item.variant && item.variant !== "Standard" ? ` (${item.variant})` : "";
    const ppuText = ppu > 1 ? ` [${ppu} pcs/unit]` : "";
    itemLines.push(
      `  • ${item.name}${variantText}${ppuText}\n    Qty: ×${item.quantity}   Total: ${priceFormatted}`,
    );
  }

  const displayTotal = formatPrice(total || totalPKRCalc, country);

  const message = `✦ T E C H 4 U ✦

✅ *Order Confirmed, ${name}!*
Thank you for choosing Tech4U. Your order has been received and will be processed shortly.

━━━━━━━━━━━━━━━━━━━━━━
📋 *ORDER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━
🔢 Order Number:  *${orderNumber}*
💰 Total Amount:  *${displayTotal}*
🚚 Shipping:      *FREE*
━━━━━━━━━━━━━━━━━━━━━━

🛒 *ORDER SUMMARY*
──────────────────────
${itemLines.join("\n──────────────────────\n")}
──────────────────────
💳 *GRAND TOTAL:  ${displayTotal}*

━━━━━━━━━━━━━━━━━━━━━━
✨ *Free shipping on all orders* ✨
You will receive updates when your order is processed and shipped.
━━━━━━━━━━━━━━━━━━━━━━

📧 info@tech4ru.com
🌐 tech4ru.com

✦ TECH4U — Luxury Redefined ✦`;

  console.log(
    `📱 Order WhatsApp → ${phoneNumber} | #${orderNumber} | ${displayTotal} (${cfg.code})`,
  );

  return sendImageThenText(
    phoneNumber,
    message,
    items,
    orderNumber,
    "CONFIRMED ✅",
  );
}

// ─────────────────────────────────────────────────────────────
// SHIPPED WhatsApp — with image support
// ✅ PAID PLAN: Image + Text
// ─────────────────────────────────────────────────────────────
export function buildShippedWhatsApp(
  name: string,
  orderNumber: string,
  courierName: string,
  trackingNumber: string,
  estimatedDays: string,
  courierTrackingUrl?: string,
  items?: Array<{
    name: string;
    variant?: string | null;
    quantity: number;
    price: number;
    piecesPerUnit?: number;
  }>,
  total?: number,
  country?: string,
): string {
  const c = country || "Pakistan";
  const displayTotal = total ? formatPrice(total, c) : null;

  let itemLines = "";
  if (items && items.length > 0) {
    const lines = items.map((item) => {
      const ppu = item.piecesPerUnit || 1;
      const itemTotalPKR = item.price * ppu * item.quantity;
      const priceFormatted = formatPrice(itemTotalPKR, c);
      const variantText =
        item.variant && item.variant !== "Standard" ? ` (${item.variant})` : "";
      return `  • ${item.name}${variantText} ×${item.quantity}   ${priceFormatted}`;
    });
    itemLines = `
🛒 *ORDER SUMMARY*
──────────────────────
${lines.join("\n")}
──────────────────────
${displayTotal ? `💳 *TOTAL: ${displayTotal}*` : ""}

`;
  }

  const trackLine = courierTrackingUrl
    ? `\n🔗 Track online: ${courierTrackingUrl}`
    : "";

  return `✦ T E C H 4 U ✦

🚚 *Order Shipped, ${name}!*
Great news — your order is on its way!

━━━━━━━━━━━━━━━━━━━━━━
📋 *SHIPPING DETAILS*
━━━━━━━━━━━━━━━━━━━━━━
🔢 Order:       *${orderNumber}*
📊 Status:      *SHIPPED* ✅
🏢 Courier:     *${courierName}*
📦 Tracking No: *${trackingNumber}*
⏱ Est. Delivery: *${estimatedDays}*${trackLine}
━━━━━━━━━━━━━━━━━━━━━━
${itemLines}📧 info@tech4ru.com
🌐 tech4ru.com

✦ TECH4U — Luxury Redefined ✦`;
}

// ─────────────────────────────────────────────────────────────
// sendShippedWhatsApp — image + text for shipped status
// ✅ PAID PLAN: Image first, then full shipped message
// ─────────────────────────────────────────────────────────────
export async function sendShippedWhatsApp(
  phoneNumber: string,
  name: string,
  orderNumber: string,
  courierName: string,
  trackingNumber: string,
  estimatedDays: string,
  courierTrackingUrl: string | undefined,
  items: Array<{
    name: string;
    variant?: string | null;
    quantity: number;
    price: number;
    piecesPerUnit?: number;
    variant_image?: string | null;
    image?: string | null;
    product_image?: string | null;
  }>,
  total: number,
  country: string,
): Promise<boolean> {
  const message = buildShippedWhatsApp(
    name,
    orderNumber,
    courierName,
    trackingNumber,
    estimatedDays,
    courierTrackingUrl,
    items,
    total,
    country,
  );

  return sendImageThenText(
    phoneNumber,
    message,
    items,
    orderNumber,
    "SHIPPED 🚚",
  );
}

// ─────────────────────────────────────────────────────────────
// DELIVERED WhatsApp
// ─────────────────────────────────────────────────────────────
export function buildDeliveredWhatsApp(
  name: string,
  orderNumber: string,
  items?: Array<{
    name: string;
    variant?: string | null;
    quantity: number;
    price: number;
    piecesPerUnit?: number;
  }>,
  total?: number,
  country?: string,
): string {
  const c = country || "Pakistan";
  const displayTotal = total ? formatPrice(total, c) : null;

  let itemLines = "";
  if (items && items.length > 0) {
    const lines = items.map((item) => {
      const ppu = item.piecesPerUnit || 1;
      const itemTotalPKR = item.price * ppu * item.quantity;
      const priceFormatted = formatPrice(itemTotalPKR, c);
      const variantText =
        item.variant && item.variant !== "Standard" ? ` (${item.variant})` : "";
      return `  • ${item.name}${variantText} ×${item.quantity}   ${priceFormatted}`;
    });
    itemLines = `
🛒 *ORDER SUMMARY*
──────────────────────
${lines.join("\n")}
──────────────────────
${displayTotal ? `💳 *TOTAL: ${displayTotal}*` : ""}

`;
  }

  return `✦ T E C H 4 U ✦

✅ *Order Delivered, ${name}!*

━━━━━━━━━━━━━━━━━━━━━━
📋 *ORDER STATUS*
━━━━━━━━━━━━━━━━━━━━━━
🔢 Order:   *${orderNumber}*
📊 Status:  *DELIVERED* ✅
━━━━━━━━━━━━━━━━━━━━━━
${itemLines}Your order has been successfully delivered! 📦🎉
We hope you love your purchase! 🛍️

📧 info@tech4ru.com
🌐 tech4ru.com

✦ TECH4U — Luxury Redefined ✦`;
}

// ─────────────────────────────────────────────────────────────
// sendDeliveredWhatsApp — image + text for delivered status
// ✅ PAID PLAN: Image first, then full delivered message
// ─────────────────────────────────────────────────────────────
export async function sendDeliveredWhatsApp(
  phoneNumber: string,
  name: string,
  orderNumber: string,
  items: Array<{
    name: string;
    variant?: string | null;
    quantity: number;
    price: number;
    piecesPerUnit?: number;
    variant_image?: string | null;
    image?: string | null;
    product_image?: string | null;
  }>,
  total: number,
  country: string,
): Promise<boolean> {
  const message = buildDeliveredWhatsApp(
    name,
    orderNumber,
    items,
    total,
    country,
  );
  return sendImageThenText(
    phoneNumber,
    message,
    items,
    orderNumber,
    "DELIVERED ✅",
  );
}

// ─────────────────────────────────────────────────────────────
// CANCELLED WhatsApp
// ─────────────────────────────────────────────────────────────
export function buildCancelledWhatsApp(
  name: string,
  orderNumber: string,
  cancelReason?: string,
  items?: Array<{
    name: string;
    variant?: string | null;
    quantity: number;
    price: number;
    piecesPerUnit?: number;
  }>,
  total?: number,
  country?: string,
): string {
  const c = country || "Pakistan";
  const displayTotal = total ? formatPrice(total, c) : null;

  let itemLines = "";
  if (items && items.length > 0) {
    const lines = items.map((item) => {
      const ppu = item.piecesPerUnit || 1;
      const itemTotalPKR = item.price * ppu * item.quantity;
      const priceFormatted = formatPrice(itemTotalPKR, c);
      const variantText =
        item.variant && item.variant !== "Standard" ? ` (${item.variant})` : "";
      return `  • ${item.name}${variantText} ×${item.quantity}   ${priceFormatted}`;
    });
    itemLines = `
🛒 *ORDER SUMMARY*
──────────────────────
${lines.join("\n")}
──────────────────────
${displayTotal ? `💳 *TOTAL: ${displayTotal}*` : ""}

`;
  }

  const reasonBlock = cancelReason ? `\n📋 *REASON:* ${cancelReason}\n` : "";

  return `✦ T E C H 4 U ✦

❌ *Order Cancelled, ${name}*

━━━━━━━━━━━━━━━━━━━━━━
📋 *ORDER STATUS*
━━━━━━━━━━━━━━━━━━━━━━
🔢 Order:   *${orderNumber}*
📊 Status:  *CANCELLED* ❌${reasonBlock}
━━━━━━━━━━━━━━━━━━━━━━
${itemLines}If you have any questions, please contact us:
📧 info@tech4ru.com
🌐 tech4ru.com

We hope to serve you again soon. 🙏

✦ TECH4U — Luxury Redefined ✦`;
}

// ─────────────────────────────────────────────────────────────
// sendCancelledWhatsApp — image + text for cancelled status
// ✅ PAID PLAN: Image first, then full cancelled message
// ─────────────────────────────────────────────────────────────
export async function sendCancelledWhatsApp(
  phoneNumber: string,
  name: string,
  orderNumber: string,
  cancelReason: string | undefined,
  items: Array<{
    name: string;
    variant?: string | null;
    quantity: number;
    price: number;
    piecesPerUnit?: number;
    variant_image?: string | null;
    image?: string | null;
    product_image?: string | null;
  }>,
  total: number,
  country: string,
): Promise<boolean> {
  const message = buildCancelledWhatsApp(
    name,
    orderNumber,
    cancelReason,
    items,
    total,
    country,
  );
  return sendImageThenText(
    phoneNumber,
    message,
    items,
    orderNumber,
    "CANCELLED ❌",
  );
}

// ─────────────────────────────────────────────────────────────
// CONFIRMED WhatsApp (text-only builder — used by buildConfirmedWhatsApp callers)
// ─────────────────────────────────────────────────────────────
export function buildConfirmedWhatsApp(
  name: string,
  orderNumber: string,
  displayTotal: string,
  items?: Array<{
    name: string;
    variant?: string | null;
    quantity: number;
    price: number;
    piecesPerUnit?: number;
  }>,
  country?: string,
): string {
  const c = country || "Pakistan";

  let itemLines = "";
  if (items && items.length > 0) {
    const lines = items.map((item) => {
      const ppu = item.piecesPerUnit || 1;
      const itemTotalPKR = item.price * ppu * item.quantity;
      const priceFormatted = formatPrice(itemTotalPKR, c);
      const variantText =
        item.variant && item.variant !== "Standard" ? ` (${item.variant})` : "";
      return `  • ${item.name}${variantText} ×${item.quantity}   ${priceFormatted}`;
    });
    itemLines = `
🛒 *ORDER SUMMARY*
──────────────────────
${lines.join("\n")}
──────────────────────
💳 *GRAND TOTAL: ${displayTotal}*

`;
  }

  return `✦ T E C H 4 U ✦

✅ *Order Confirmed, ${name}!*
Thank you for choosing Tech4U. Your order has been confirmed.

━━━━━━━━━━━━━━━━━━━━━━
📋 *ORDER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━
🔢 Order Number: *${orderNumber}*
📊 Status:       *CONFIRMED* ✅
💰 Total Amount: *${displayTotal}*
━━━━━━━━━━━━━━━━━━━━━━
${itemLines}We'll notify you here on WhatsApp when your order is shipped.

📧 info@tech4ru.com
🌐 tech4ru.com

✦ TECH4U — Luxury Redefined ✦`;
}

// ─────────────────────────────────────────────────────────────
// sendConfirmedWhatsApp — image + text for confirmed status
// ✅ PAID PLAN: Image + full text in ONE message
// ─────────────────────────────────────────────────────────────
export async function sendConfirmedWhatsApp(
  phoneNumber: string,
  name: string,
  orderNumber: string,
  displayTotal: string,
  items: Array<{
    name: string;
    variant?: string | null;
    quantity: number;
    price: number;
    piecesPerUnit?: number;
    variant_image?: string | null;
    image?: string | null;
    product_image?: string | null;
  }>,
  country: string,
): Promise<boolean> {
  const message = buildConfirmedWhatsApp(
    name,
    orderNumber,
    displayTotal,
    items,
    country,
  );
  return sendImageThenText(
    phoneNumber,
    message,
    items,
    orderNumber,
    "CONFIRMED ✅",
  );
}

// ─────────────────────────────────────────────────────────────
// PROCESSING WhatsApp
// ─────────────────────────────────────────────────────────────
export function buildProcessingWhatsApp(
  name: string,
  orderNumber: string,
  displayTotal?: string,
  items?: Array<{
    name: string;
    variant?: string | null;
    quantity: number;
    price: number;
    piecesPerUnit?: number;
  }>,
  country?: string,
): string {
  const c = country || "Pakistan";

  let itemLines = "";
  if (items && items.length > 0) {
    const lines = items.map((item) => {
      const ppu = item.piecesPerUnit || 1;
      const itemTotalPKR = item.price * ppu * item.quantity;
      const priceFormatted = formatPrice(itemTotalPKR, c);
      const variantText =
        item.variant && item.variant !== "Standard" ? ` (${item.variant})` : "";
      return `  • ${item.name}${variantText} ×${item.quantity}   ${priceFormatted}`;
    });
    itemLines = `
🛒 *ORDER SUMMARY*
──────────────────────
${lines.join("\n")}
──────────────────────
${displayTotal ? `💳 *TOTAL: ${displayTotal}*` : ""}

`;
  }

  return `✦ T E C H 4 U ✦

⚙️ *Order Processing, ${name}*

━━━━━━━━━━━━━━━━━━━━━━
📋 *ORDER STATUS*
━━━━━━━━━━━━━━━━━━━━━━
🔢 Order:   *${orderNumber}*
📊 Status:  *PROCESSING* ⚙️
━━━━━━━━━━━━━━━━━━━━━━
${itemLines}We'll notify you here on WhatsApp when your order is shipped.

📧 info@tech4ru.com
🌐 tech4ru.com

Thank you for your patience! 🙏

✦ TECH4U — Luxury Redefined ✦`;
}