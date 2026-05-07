// app/api/send-order-notification/route.ts
// ✅ COMPLETE FIX:
// 1. WhatsApp ALL countries fixed (Australia, UK, USA, Pakistan)
// 2. WhatsApp image send added (Green API sendFileByUrl)
// 3. Email images fixed (table-based layout for compatibility)
// 4. Spam folder fix (proper email headers, list-unsubscribe, from name)

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  currencies,
  Currency,
  convertPrice,
  formatPrice,
} from "@/lib/currency";

// ============================================
// SMTP EMAIL SETUP
// ✅ SPAM FIX: Extra headers to avoid spam filters
// ============================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
  // ✅ Spam fix: set proper name
  from: `"Tech4U Orders" <${process.env.SMTP_USER}>`,
});

// ============================================
// Currency helpers
// ============================================
function getCurrencyByCode(currencyCode: string): Currency {
  return currencies.find((c) => c.code === currencyCode) || currencies[0];
}
function convertPriceToCurrency(
  priceInPKR: number,
  currencyCode: string,
): number {
  return convertPrice(priceInPKR, getCurrencyByCode(currencyCode));
}
function formatPriceWithCurrency(
  priceInPKR: number,
  currencyCode: string,
): string {
  return formatPrice(priceInPKR, getCurrencyByCode(currencyCode));
}

// ============================================
// ✅ PHONE FORMATTER — ALL COUNTRIES FIXED
//
// Core rule: Strip +, keep all digits, add @c.us
// +61426855997  → 61426855997@c.us  ✅ Australia
// +12125551234  → 12125551234@c.us  ✅ USA
// +447123456789 → 447123456789@c.us ✅ UK
// +923001234567 → 923001234567@c.us ✅ Pakistan (intl)
// 03001234567   → 923001234567@c.us ✅ Pakistan (local)
// +971501234567 → 971501234567@c.us ✅ UAE
// ============================================
function formatPhoneForWhatsApp(phoneNumber: string): string {
  let clean = phoneNumber.trim().replace(/[\s\-\(\)\.]/g, "");

  if (clean.startsWith("+")) {
    // Remove only '+' — all digits stay as-is (universal rule)
    clean = clean.slice(1);
  } else if (clean.startsWith("0") && clean.length === 11 && clean[1] === "3") {
    // Pakistan local format ONLY: 03001234567 → 923001234567
    clean = "92" + clean.slice(1);
  }

  // Remove any remaining non-digit chars
  clean = clean.replace(/\D/g, "");

  const chatId = `${clean}@c.us`;
  console.log(`📱 Phone → chatId: "${phoneNumber}" → "${chatId}"`);
  return chatId;
}

// ============================================
// HELPER: Valid public image URL
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
// WHATSAPP TEXT — Green API sendMessage
// ============================================
async function sendWhatsAppText(
  customerPhone: string,
  message: string,
): Promise<boolean> {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const apiToken = process.env.GREEN_API_TOKEN;

  if (!instanceId || !apiToken) {
    console.error("❌ GREEN_API credentials missing in .env.local!");
    return false;
  }

  const chatId = formatPhoneForWhatsApp(customerPhone);
  console.log(`📱 WhatsApp text → ${chatId}`);

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
  } catch (error: any) {
    console.error(`❌ WhatsApp text error (${chatId}):`, error.message);
    return false;
  }
}

// ============================================
// ✅ NEW: WHATSAPP IMAGE — Green API sendFileByUrl
// ============================================
async function sendWhatsAppImage(
  customerPhone: string,
  imageUrl: string,
  caption: string,
): Promise<boolean> {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const apiToken = process.env.GREEN_API_TOKEN;

  if (!instanceId || !apiToken) return false;
  if (!isValidPublicImageUrl(imageUrl)) {
    console.warn(`⚠️ Image URL invalid/localhost — skipping: ${imageUrl}`);
    return false;
  }

  const chatId = formatPhoneForWhatsApp(customerPhone);
  console.log(`🖼️ WhatsApp image → ${chatId} | URL: ${imageUrl}`);

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
  } catch (error: any) {
    console.error(`❌ WhatsApp image error (${chatId}):`, error.message);
    return false;
  }
}

// ============================================
// WHATSAPP FULL FLOW: Image → wait → Text
// ============================================
async function sendWhatsAppViaGreenAPI(
  customerPhone: string,
  message: string,
  items: any[],
): Promise<boolean> {
  // Step 1: Find first item with valid public image
  const firstWithImage = items.find((item: any) =>
    isValidPublicImageUrl(item.image),
  );

  if (firstWithImage?.image) {
    const imageCaption = `🛍️ *${firstWithImage.name}*${
      firstWithImage.variant ? ` (${firstWithImage.variant})` : ""
    }\n📦 New order — Tech4U`;

    console.log("🖼️ Sending WhatsApp image first...");
    const imageSent = await sendWhatsAppImage(
      customerPhone,
      firstWithImage.image,
      imageCaption,
    );
    if (!imageSent) {
      console.warn("⚠️ Image failed — continuing with text");
    }
    // Wait 1 second between image and text
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } else {
    console.log("ℹ️ No valid public image — text only");
  }

  // Step 2: Send full text message
  return sendWhatsAppText(customerPhone, message);
}

// ============================================
// WHATSAPP MESSAGE BUILDER
// ============================================
function buildWhatsAppMessage(
  name: string,
  orderNumber: string,
  orderDate: string,
  items: any[],
  totalPKR: number,
  currencyCode: string,
  shippingAddress: string,
  paymentMethod: string,
): string {
  const itemsList = items
    .map((item: any, index: number) => {
      const itemTotalPKR = item.pricePKR || item.price;
      const convertedPrice = formatPriceWithCurrency(
        itemTotalPKR,
        currencyCode,
      );
      const ppu = item.piecesPerUnit || 1;
      const totalPieces = ppu * item.quantity;

      let itemLine = `${index + 1}. *${item.name}*`;
      if (item.variant && item.variant !== "Standard") {
        itemLine += ` (${item.variant})`;
      }
      itemLine += `\n   📦 Qty: ${item.quantity} unit${item.quantity > 1 ? "s" : ""}`;
      if (ppu > 1) {
        itemLine += ` × ${ppu} pieces = ${totalPieces} total`;
      }
      itemLine += `\n   💵 Amount: ${convertedPrice}`;
      return itemLine;
    })
    .join("\n\n");

  const convertedTotal = formatPriceWithCurrency(totalPKR, currencyCode);

  return `✅ *Order Confirmed — Tech4U* 🎉

Hello *${name}*! Thank you for your purchase!

━━━━━━━━━━━━━━━━━
📦 *Order Number:* ${orderNumber}
📅 *Order Date:* ${orderDate}
💳 *Payment:* ${paymentMethod}
━━━━━━━━━━━━━━━━━

🛍️ *Items Ordered (${items.length} item${items.length > 1 ? "s" : ""}):*

${itemsList}

━━━━━━━━━━━━━━━━━
🚚 *Shipping:* FREE
💰 *Total Amount: ${convertedTotal}*
━━━━━━━━━━━━━━━━━

📍 *Delivery Address:*
${shippingAddress}

Your order is being processed and will be shipped soon.
You'll receive tracking info here on WhatsApp once shipped.

For any questions:
📧 info@tech4ru.com
🌐 tech4ru.com

Thank you for choosing Tech4U! ✨`;
}

// ============================================
// ✅ EMAIL HTML BUILDER
// FIXED: Table-based image layout (works in all email clients)
// FIXED: Spam prevention headers
// FIXED: Images now show correctly in Gmail/Outlook/Yahoo
// ============================================
function buildCustomerEmailHtml(
  name: string,
  orderNumber: string,
  orderDate: string,
  items: any[],
  totalPKR: number,
  currencyCode: string,
  shippingAddress: string,
  paymentMethod: string,
): string {
  const convertedTotal = formatPriceWithCurrency(totalPKR, currencyCode);

  // ✅ FIXED: Use <table> for image+text layout (flexbox breaks in email clients)
  const itemsHtml = items
    .map((item: any) => {
      const itemTotalPKR = item.pricePKR || item.price;
      const convertedPrice = formatPriceWithCurrency(
        itemTotalPKR,
        currencyCode,
      );
      const ppu = item.piecesPerUnit || 1;
      const totalPieces = ppu * item.quantity;
      const hasImage = isValidPublicImageUrl(item.image);

      return `
        <tr>
          <td style="padding:14px 12px;border-bottom:1px solid #f0f0f0;vertical-align:top;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="76" style="vertical-align:top;padding-right:14px;">
                  ${
                    hasImage
                      ? `<img src="${item.image}" width="72" height="72"
                          style="border-radius:10px;object-fit:cover;display:block;
                                 border:1px solid #eee;box-shadow:0 2px 8px rgba(0,0,0,0.08);"
                          alt="${item.name}" />`
                      : `<table cellpadding="0" cellspacing="0" border="0">
                          <tr><td width="72" height="72"
                            style="width:72px;height:72px;border-radius:10px;background:#f5f5f5;
                                   text-align:center;font-size:28px;border:1px solid #eee;">
                            📦
                          </td></tr>
                        </table>`
                  }
                </td>
                <td style="vertical-align:top;">
                  <p style="margin:0 0 5px;font-weight:700;font-size:14px;color:#1a1a1a;
                             font-family:Arial,sans-serif;">
                    ${item.name}
                  </p>
                  ${
                    item.variant && item.variant !== "Standard"
                      ? `<p style="margin:0 0 4px;font-size:12px;color:#888;font-family:Arial,sans-serif;">
                           Variant: ${item.variant}
                         </p>`
                      : ""
                  }
                  <p style="margin:0;font-size:12px;color:#666;font-family:Arial,sans-serif;">
                    Qty: <strong>${item.quantity} unit${item.quantity > 1 ? "s" : ""}</strong>
                    ${
                      ppu > 1
                        ? ` &times; ${ppu} pieces = <strong>${totalPieces} total</strong>`
                        : ""
                    }
                  </p>
                </td>
                <td style="vertical-align:top;text-align:right;white-space:nowrap;
                           font-weight:700;font-size:15px;color:#1a1a1a;
                           font-family:Arial,sans-serif;padding-left:12px;">
                  ${convertedPrice}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Order Confirmation #${orderNumber} — Tech4U</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:Arial,Helvetica,sans-serif;">

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f0e8;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="620"
          style="max-width:620px;background:#ffffff;border-radius:16px;
                 overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#1a1a1a;padding:32px 30px;text-align:center;">
              <h1 style="margin:0;color:#daa520;font-size:30px;letter-spacing:3px;
                         font-family:Arial,sans-serif;">TECH4U</h1>
              <p style="margin:8px 0 0;color:#888;font-size:13px;letter-spacing:1px;
                         font-family:Arial,sans-serif;">ORDER CONFIRMATION</p>
            </td>
          </tr>

          <!-- SUCCESS BANNER -->
          <tr>
            <td style="background-color:#22c55e;padding:16px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:17px;font-weight:bold;
                         font-family:Arial,sans-serif;">
                &#10003; Your Order is Confirmed!
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:30px;">

              <!-- Greeting -->
              <p style="font-size:16px;margin:0 0 24px;color:#333;
                         font-family:Arial,sans-serif;line-height:1.6;">
                Hello <strong style="color:#1a1a1a;">${name}</strong>! &#127881;<br>
                Thank you for shopping with Tech4U. Your order has been successfully placed
                and is being processed.
              </p>

              <!-- Order Info Box -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%"
                style="background:#fafafa;border:1px solid #eeeeee;border-radius:12px;
                       margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#666;font-family:Arial,sans-serif;">
                          Order Number
                        </td>
                        <td style="padding:5px 0;font-size:13px;font-weight:700;
                                   color:#daa520;text-align:right;font-family:monospace,Arial,sans-serif;">
                          ${orderNumber}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#666;font-family:Arial,sans-serif;">
                          Order Date
                        </td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;
                                   color:#333;text-align:right;font-family:Arial,sans-serif;">
                          ${orderDate}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#666;font-family:Arial,sans-serif;">
                          Payment Method
                        </td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;
                                   color:#333;text-align:right;font-family:Arial,sans-serif;">
                          ${paymentMethod}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#666;font-family:Arial,sans-serif;">
                          Currency
                        </td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;
                                   color:#333;text-align:right;font-family:Arial,sans-serif;">
                          ${currencyCode}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ITEMS ORDERED HEADING -->
              <p style="margin:0 0 14px;font-size:16px;color:#1a1a1a;font-weight:700;
                         border-bottom:2px solid #daa520;padding-bottom:10px;
                         font-family:Arial,sans-serif;">
                &#128717; Items Ordered (${items.length} item${items.length > 1 ? "s" : ""})
              </p>

              <!-- ITEMS TABLE -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%"
                style="margin-bottom:24px;border-collapse:collapse;">
                <thead>
                  <tr style="background-color:#f9f9f9;">
                    <th style="text-align:left;padding:10px 12px;font-size:12px;
                               color:#888;font-weight:600;border-bottom:2px solid #eeeeee;
                               font-family:Arial,sans-serif;">
                      PRODUCT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- ORDER TOTAL -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%"
                style="background-color:#1a1a1a;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#aaaaaa;
                                   font-family:Arial,sans-serif;">
                          Subtotal (${items.length} item${items.length > 1 ? "s" : ""})
                        </td>
                        <td style="padding:5px 0;font-size:13px;color:#ffffff;
                                   text-align:right;font-family:Arial,sans-serif;">
                          ${convertedTotal}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#aaaaaa;
                                   font-family:Arial,sans-serif;">
                          Shipping
                        </td>
                        <td style="padding:5px 0;font-size:13px;color:#22c55e;
                                   text-align:right;font-weight:600;font-family:Arial,sans-serif;">
                          FREE
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 0;font-size:16px;color:#ffffff;
                                   font-weight:700;border-top:1px solid #333333;
                                   font-family:Arial,sans-serif;">
                          Total Paid
                        </td>
                        <td style="padding:12px 0 0;font-size:20px;color:#daa520;
                                   font-weight:800;text-align:right;border-top:1px solid #333333;
                                   font-family:Arial,sans-serif;">
                          ${convertedTotal}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- SHIPPING ADDRESS -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%"
                style="border:1px solid #eeeeee;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 12px;font-weight:700;font-size:14px;color:#1a1a1a;
                               font-family:Arial,sans-serif;">
                      &#128205; Shipping Address
                    </p>
                    <p style="margin:0;font-size:13px;color:#555555;line-height:1.7;
                               font-family:Arial,sans-serif;">
                      ${shippingAddress.split(", ").join("<br>")}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- PERKS -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%"
                style="margin-bottom:28px;">
                <tr>
                  <td width="25%" style="padding:4px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="background:#f9f9f9;border-radius:10px;padding:12px;
                                   text-align:center;font-size:12px;color:#555555;
                                   font-family:Arial,sans-serif;">
                          &#128274;<br><strong>Secure Payment</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="25%" style="padding:4px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="background:#f9f9f9;border-radius:10px;padding:12px;
                                   text-align:center;font-size:12px;color:#555555;
                                   font-family:Arial,sans-serif;">
                          &#128666;<br><strong>Free Shipping</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="25%" style="padding:4px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="background:#f9f9f9;border-radius:10px;padding:12px;
                                   text-align:center;font-size:12px;color:#555555;
                                   font-family:Arial,sans-serif;">
                          &#8617;<br><strong>30-Day Returns</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="25%" style="padding:4px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="background:#f9f9f9;border-radius:10px;padding:12px;
                                   text-align:center;font-size:12px;color:#555555;
                                   font-family:Arial,sans-serif;">
                          &#10022;<br><strong>Luxury Packaging</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- TRACKING NOTE -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%"
                style="margin-bottom:24px;">
                <tr>
                  <td style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;
                             padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#92400e;font-family:Arial,sans-serif;">
                      &#128230; <strong>What's next?</strong> We are preparing your order.
                      Once shipped, you'll receive tracking information via WhatsApp
                      on your registered number.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- FOOTER CONTACT -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="border-top:1px solid #eeeeee;padding-top:20px;">
                    <p style="margin:0 0 6px;font-size:14px;font-family:Arial,sans-serif;">
                      <strong>Best regards,</strong><br>
                      <span style="color:#daa520;font-weight:700;">Tech4U Team</span>
                    </p>
                    <p style="margin:0;color:#888888;font-size:12px;line-height:1.8;
                               font-family:Arial,sans-serif;">
                      &#128231; Support: info@tech4ru.com<br>
                      &#127760; Website: tech4ru.com
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- EMAIL FOOTER -->
          <tr>
            <td style="background-color:#1a1a1a;padding:16px;text-align:center;">
              <p style="margin:0;color:#555555;font-size:11px;font-family:Arial,sans-serif;">
                &copy; 2025 Tech4U. All rights reserved. | SSL Secured Checkout
              </p>
              <p style="margin:6px 0 0;color:#444444;font-size:10px;font-family:Arial,sans-serif;">
                You received this email because you placed an order at tech4ru.com<br>
                <a href="mailto:info@tech4ru.com" style="color:#666;text-decoration:none;">
                  Contact Support
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ============================================
// TEXT EMAIL (fallback for plain text clients)
// ============================================
function buildCustomerEmailText(
  name: string,
  orderNumber: string,
  orderDate: string,
  items: any[],
  totalPKR: number,
  currencyCode: string,
  shippingAddress: string,
  paymentMethod: string,
): string {
  const itemsList = items
    .map((item: any, index: number) => {
      const itemTotalPKR = item.pricePKR || item.price;
      const convertedPrice = formatPriceWithCurrency(
        itemTotalPKR,
        currencyCode,
      );
      const ppu = item.piecesPerUnit || 1;
      const totalPieces = ppu * item.quantity;
      let line = `${index + 1}. ${item.name}`;
      if (item.variant && item.variant !== "Standard")
        line += ` (${item.variant})`;
      line += ` — Qty: ${item.quantity} unit${item.quantity > 1 ? "s" : ""}`;
      if (ppu > 1) line += ` x ${ppu} pieces = ${totalPieces} total`;
      line += ` — ${convertedPrice}`;
      return line;
    })
    .join("\n");

  const convertedTotal = formatPriceWithCurrency(totalPKR, currencyCode);

  return `Hello ${name}! Thank you for shopping with Tech4U!

Your order has been successfully placed.

Order Number: ${orderNumber}
Order Date: ${orderDate}
Payment Method: ${paymentMethod}

Items Ordered (${items.length}):
${itemsList}

Shipping: FREE
Total Amount: ${convertedTotal}

Delivery Address:
${shippingAddress}

We are currently processing your order and will notify you once it has been shipped.

Best regards,
Tech4U Team
Support: info@tech4ru.com
Website: tech4ru.com

---
You received this email because you placed an order at tech4ru.com
To unsubscribe from order notifications, reply with "unsubscribe"`;
}

// ============================================
// ADMIN EMAIL HTML
// ============================================
function buildAdminItemsHtml(items: any[], currencyCode: string): string {
  return items
    .map((item: any) => {
      const ppu = item.piecesPerUnit || 1;
      const totalPieces = ppu * item.quantity;
      const hasImage = isValidPublicImageUrl(item.image);
      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #eee;vertical-align:top;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right:10px;vertical-align:top;">
                  ${
                    hasImage
                      ? `<img src="${item.image}" width="50" height="50"
                          style="border-radius:8px;object-fit:cover;display:block;" alt="${item.name}" />`
                      : `<table cellpadding="0" cellspacing="0" border="0">
                          <tr><td width="50" height="50"
                            style="width:50px;height:50px;background:#f5f5f5;border-radius:8px;
                                   text-align:center;font-size:22px;">📦</td></tr>
                        </table>`
                  }
                </td>
                <td style="vertical-align:top;">
                  <strong style="font-family:Arial,sans-serif;font-size:13px;">${item.name}</strong>
                  ${item.variant ? ` <span style="color:#888;font-size:12px;">(${item.variant})</span>` : ""}
                  ${ppu > 1 ? `<br><span style="font-size:11px;color:#888;font-family:Arial,sans-serif;">${ppu} pieces/unit = ${totalPieces} total</span>` : ""}
                </td>
              </tr>
            </table>
          </td>
          <td style="text-align:center;padding:12px;border-bottom:1px solid #eee;
                     font-family:Arial,sans-serif;font-size:13px;">
            x${item.quantity}
          </td>
          <td style="text-align:right;padding:12px;border-bottom:1px solid #eee;
                     font-family:Arial,sans-serif;font-size:13px;">
            <strong>${formatPriceWithCurrency(item.pricePKR || item.price, currencyCode)}</strong>
            <br><span style="font-size:10px;color:#aaa;">PKR ${(item.pricePKR || item.price).toLocaleString()}</span>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ============================================
// MAIN API ROUTE HANDLER
// ============================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
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
      currency: currencyCode = "PKR",
    } = body;

    const orderDate = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    console.log("========================================");
    console.log("🚀 NEW ORDER NOTIFICATION");
    console.log("📦 Order:", orderNumber);
    console.log("👤 Customer:", name);
    console.log("📧 Email:", email);
    console.log("📱 Phone:", phone);
    console.log("💰 Total PKR:", total);
    console.log("🌍 Currency:", currencyCode);
    console.log("🛍️ Items count:", items?.length);
    console.log("🖼️ First item image:", items?.[0]?.image || "none");
    console.log("========================================");

    if (!email || !phone || !name || !orderNumber) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    let emailSent = false;
    let whatsappSent = false;

    // ==========================================
    // STEP 1: EMAIL → CUSTOMER
    // ✅ SPAM FIX: Proper headers + List-Unsubscribe
    // ✅ IMAGE FIX: Table-based layout
    // ==========================================
    try {
      const emailText = buildCustomerEmailText(
        name,
        orderNumber,
        orderDate,
        items,
        total,
        currencyCode,
        shippingAddress || "",
        paymentMethod || "Card",
      );
      const emailHtml = buildCustomerEmailHtml(
        name,
        orderNumber,
        orderDate,
        items,
        total,
        currencyCode,
        shippingAddress || "",
        paymentMethod || "Card",
      );

      await transporter.sendMail({
        // ✅ SPAM FIX 1: Proper "From" with display name
        from: `"Tech4U Orders" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: email,
        // ✅ SPAM FIX 2: ReplyTo set
        replyTo: `"Tech4U Support" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        subject: `Order Confirmed #${orderNumber} — Tech4U`,
        text: emailText,
        html: emailHtml,
        // ✅ SPAM FIX 3: Anti-spam headers
        headers: {
          // Unique message ID
          "Message-ID": `<order-${orderNumber}-${Date.now()}@tech4ru.com>`,
          // Tell spam filters this is transactional (not bulk marketing)
          "X-Mailer": "Tech4U-OrderSystem-1.0",
          "X-Transaction-Email": "true",
          // ✅ SPAM FIX 4: List-Unsubscribe header (required to avoid spam classification)
          "List-Unsubscribe": `<mailto:info@tech4ru.com?subject=Unsubscribe-${orderNumber}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          // Precedence bulk would mark as spam — use "transactional" instead
          Precedence: "transactional",
        },
      });

      console.log("✅ EMAIL SENT to:", email);
      emailSent = true;
    } catch (emailError: any) {
      console.error("❌ EMAIL FAILED:", emailError.message);
      emailSent = false;
    }

    // ==========================================
    // STEP 2: WHATSAPP → CUSTOMER
    // ✅ FIX: Image + text for ALL countries
    // ==========================================
    try {
      const waMessage = buildWhatsAppMessage(
        name,
        orderNumber,
        orderDate,
        items,
        total,
        currencyCode,
        shippingAddress || "",
        paymentMethod || "Card",
      );
      // ✅ FIXED: Pass items so image can be sent
      whatsappSent = await sendWhatsAppViaGreenAPI(
        phone,
        waMessage,
        items || [],
      );
      console.log(
        `📱 WhatsApp ${whatsappSent ? "✅ SENT" : "❌ FAILED"} to: ${phone}`,
      );
    } catch (waError: any) {
      console.error("❌ WHATSAPP ERROR:", waError.message);
      whatsappSent = false;
    }

    // ==========================================
    // STEP 3: ADMIN ALERT → OWNER EMAIL
    // ==========================================
    try {
      const ownerEmail = process.env.OWNER_EMAIL || process.env.SMTP_USER;
      const convertedTotalDisplay = formatPriceWithCurrency(
        total,
        currencyCode,
      );
      const itemsAdminHtml = buildAdminItemsHtml(items, currencyCode);

      await transporter.sendMail({
        from: `"Tech4U System" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: ownerEmail,
        subject: `NEW ORDER #${orderNumber} — ${convertedTotalDisplay} (${currencyCode}) — ${name}`,
        headers: {
          "Message-ID": `<admin-order-${orderNumber}-${Date.now()}@tech4ru.com>`,
          "X-Transaction-Email": "true",
          Precedence: "transactional",
        },
        html: `
          <html>
          <body style="font-family:Arial,sans-serif;background:#f5f0e8;padding:20px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="650"
                  style="max-width:650px;background:#fff;border-radius:12px;overflow:hidden;border:2px solid #daa520;">
                  <tr>
                    <td style="background:#1a1a1a;padding:20px;text-align:center;">
                      <h2 style="margin:0;color:#daa520;font-family:Arial,sans-serif;">&#128717; NEW ORDER</h2>
                      <p style="margin:5px 0 0;color:#888;font-family:Arial,sans-serif;">Order #${orderNumber}</p>
                      <p style="margin:5px 0 0;color:#daa520;font-size:12px;font-family:Arial,sans-serif;">
                        Currency: ${currencyCode} | Total: ${convertedTotalDisplay}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px;">
                      <p style="font-family:Arial,sans-serif;"><strong>Customer:</strong> ${name}</p>
                      <p style="font-family:Arial,sans-serif;"><strong>Email:</strong> ${email}</p>
                      <p style="font-family:Arial,sans-serif;"><strong>Phone:</strong> ${phone}</p>
                      <p style="font-family:Arial,sans-serif;"><strong>Date:</strong> ${orderDate}</p>
                      <p style="font-family:Arial,sans-serif;"><strong>Payment:</strong> ${paymentMethod}</p>
                      <p style="font-family:Arial,sans-serif;"><strong>Address:</strong> ${shippingAddress}</p>

                      <h3 style="font-family:Arial,sans-serif;">Items (${items.length}):</h3>
                      <table cellpadding="0" cellspacing="0" border="0" width="100%"
                        style="border-collapse:collapse;">
                        <thead>
                          <tr>
                            <th style="text-align:left;padding:8px;font-family:Arial,sans-serif;">Product</th>
                            <th style="text-align:center;padding:8px;font-family:Arial,sans-serif;">Qty</th>
                            <th style="text-align:right;padding:8px;font-family:Arial,sans-serif;">Amount (${currencyCode})</th>
                          </tr>
                        </thead>
                        <tbody>${itemsAdminHtml}</tbody>
                        <tfoot>
                          <tr>
                            <td colspan="2" style="text-align:right;padding:12px;font-family:Arial,sans-serif;">
                              <strong>TOTAL:</strong>
                            </td>
                            <td style="text-align:right;padding:12px;">
                              <strong style="color:#daa520;font-family:Arial,sans-serif;">
                                ${formatPriceWithCurrency(total, currencyCode)}
                              </strong>
                              <br>
                              <span style="font-size:11px;color:#888;font-family:Arial,sans-serif;">
                                PKR ${total.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>

                      <p style="margin-top:20px;font-size:12px;color:#888;font-family:Arial,sans-serif;">
                        Email to customer: ${emailSent ? "&#10003; Sent" : "&#10007; Failed"}<br>
                        WhatsApp to customer: ${whatsappSent ? "&#10003; Sent" : "&#10007; Failed/Not delivered"}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          </body>
          </html>
        `,
      });
    } catch (adminErr: any) {
      console.error("❌ Admin alert failed:", adminErr.message);
    }

    return NextResponse.json({
      success: emailSent,
      emailSent,
      whatsappSent,
      message: emailSent
        ? `Email sent to ${email}` +
          (whatsappSent
            ? ` | WhatsApp sent to ${phone}`
            : ` | WhatsApp not delivered (customer may not have WhatsApp)`)
        : "Email failed — check SMTP_PASS in .env.local",
    });
  } catch (error: any) {
    console.error("❌ ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
