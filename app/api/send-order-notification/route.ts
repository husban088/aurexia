// app/api/send-order-notification/route.ts
// ✅ COMPLETE FIX: Full cart details in Email + WhatsApp + OrderSuccess

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
});

// ============================================
// Helper: Get currency by code
// ============================================
function getCurrencyByCode(currencyCode: string): Currency {
  return currencies.find((c) => c.code === currencyCode) || currencies[0];
}

function convertPriceToCurrency(
  priceInPKR: number,
  currencyCode: string
): number {
  const currency = getCurrencyByCode(currencyCode);
  return convertPrice(priceInPKR, currency);
}

function formatPriceWithCurrency(
  priceInPKR: number,
  currencyCode: string
): string {
  const currency = getCurrencyByCode(currencyCode);
  return formatPrice(priceInPKR, currency);
}

// ============================================
// ✅ Phone formatter — works for ALL countries
// ============================================
function formatPhoneForWhatsApp(phoneNumber: string): string {
  let clean = phoneNumber.replace(/[\s\-\(\)\.]/g, "");
  if (clean.startsWith("+")) {
    clean = clean.slice(1);
  }
  if (clean.startsWith("0") && clean.length === 11) {
    clean = "92" + clean.slice(1);
  }
  const chatId = `${clean}@c.us`;
  console.log(`📱 Phone format: "${phoneNumber}" → chatId: "${chatId}"`);
  return chatId;
}

// ============================================
// WHATSAPP via GREEN API
// ============================================
async function sendWhatsAppViaGreenAPI(
  customerPhone: string,
  message: string
): Promise<boolean> {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const apiToken = process.env.GREEN_API_TOKEN;

  if (!instanceId || !apiToken) {
    console.error("❌ GREEN_API credentials missing!");
    return false;
  }

  const chatId = formatPhoneForWhatsApp(customerPhone);

  try {
    const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message }),
    });

    const result = await response.json();

    if (response.ok && result.idMessage) {
      console.log("✅ WhatsApp SENT! Message ID:", result.idMessage);
      return true;
    } else {
      console.error("❌ Green API Error:", JSON.stringify(result));
      return false;
    }
  } catch (error: any) {
    console.error("❌ WhatsApp fetch error:", error.message);
    return false;
  }
}

// ============================================
// ✅ COMPLETE WHATSAPP MESSAGE — Full cart details
// ============================================
function buildWhatsAppMessage(
  name: string,
  orderNumber: string,
  orderDate: string,
  items: any[],
  totalPKR: number,
  currencyCode: string,
  shippingAddress: string,
  paymentMethod: string
): string {
  // Build detailed items list with pieces info
  const itemsList = items
    .map((item: any, index: number) => {
      const itemTotalPKR = item.pricePKR || item.price;
      const convertedPrice = formatPriceWithCurrency(
        itemTotalPKR,
        currencyCode
      );
      const ppu = item.piecesPerUnit || 1;
      const totalPieces = ppu * item.quantity;

      let itemLine = `${index + 1}. *${item.name}*`;
      if (item.variant && item.variant !== "Standard") {
        itemLine += ` (${item.variant})`;
      }
      itemLine += `\n   📦 Qty: ${item.quantity} unit${
        item.quantity > 1 ? "s" : ""
      }`;
      if (ppu > 1) {
        itemLine += ` × ${ppu} pieces = ${totalPieces} total pieces`;
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

Your order is being processed and will be shipped soon. You'll receive tracking info here on WhatsApp once shipped.

For any questions, contact us:
📧 info@tech4ru.com
🌐 tech4ru.com

Thank you for choosing Tech4U! ✨`;
}

// ============================================
// ✅ COMPLETE HTML EMAIL — Full cart with images
// ============================================
function buildCustomerEmailHtml(
  name: string,
  orderNumber: string,
  orderDate: string,
  items: any[],
  totalPKR: number,
  currencyCode: string,
  shippingAddress: string,
  paymentMethod: string
): string {
  const convertedTotal = formatPriceWithCurrency(totalPKR, currencyCode);
  const currency = getCurrencyByCode(currencyCode);

  // ✅ Build items HTML — each item with image, name, variant, pieces, price
  const itemsHtml = items
    .map((item: any) => {
      const itemTotalPKR = item.pricePKR || item.price;
      const convertedPrice = formatPriceWithCurrency(
        itemTotalPKR,
        currencyCode
      );
      const ppu = item.piecesPerUnit || 1;
      const totalPieces = ppu * item.quantity;
      const hasImage =
        item.image &&
        item.image !== "null" &&
        item.image !== "" &&
        item.image !== null;

      return `
        <tr>
          <td style="padding:16px 12px;border-bottom:1px solid #f0f0f0;vertical-align:middle;">
            <div style="display:flex;align-items:center;gap:14px;">
              ${
                hasImage
                  ? `<img src="${item.image}" width="70" height="70"
                      style="border-radius:10px;object-fit:cover;flex-shrink:0;
                             border:1px solid #eee;box-shadow:0 2px 8px rgba(0,0,0,0.08);"
                      alt="${item.name}" />`
                  : `<div style="width:70px;height:70px;border-radius:10px;background:#f5f5f5;
                                  display:flex;align-items:center;justify-content:center;
                                  font-size:24px;flex-shrink:0;border:1px solid #eee;">📦</div>`
              }
              <div>
                <p style="margin:0 0 4px;font-weight:700;font-size:14px;color:#1a1a1a;">
                  ${item.name}
                </p>
                ${
                  item.variant && item.variant !== "Standard"
                    ? `<p style="margin:0 0 4px;font-size:12px;color:#888;">Variant: ${item.variant}</p>`
                    : ""
                }
                <p style="margin:0;font-size:12px;color:#666;">
                  Qty: <strong>${item.quantity} unit${
        item.quantity > 1 ? "s" : ""
      }</strong>
                  ${
                    ppu > 1
                      ? ` × ${ppu} pieces = <strong>${totalPieces} total pieces</strong>`
                      : ""
                  }
                </p>
              </div>
            </div>
          </td>
          <td style="text-align:right;padding:16px 12px;border-bottom:1px solid #f0f0f0;
                     vertical-align:middle;font-weight:700;font-size:15px;color:#1a1a1a;
                     white-space:nowrap;">
            ${convertedPrice}
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
  <title>Order Confirmation #${orderNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
  <div style="max-width:620px;margin:24px auto;background:#fff;border-radius:16px;
              overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <!-- ===== HEADER ===== -->
    <div style="background:#1a1a1a;padding:32px 30px;text-align:center;">
      <h1 style="margin:0;color:#daa520;font-size:30px;letter-spacing:3px;">TECH4U</h1>
      <p style="margin:8px 0 0;color:#888;font-size:13px;letter-spacing:1px;">ORDER CONFIRMATION</p>
    </div>

    <!-- ===== SUCCESS BANNER ===== -->
    <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:16px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:17px;font-weight:bold;">
        ✅ Your Order is Confirmed!
      </p>
    </div>

    <!-- ===== BODY ===== -->
    <div style="padding:30px;">

      <!-- Greeting -->
      <p style="font-size:16px;margin:0 0 24px;color:#333;">
        Hello <strong style="color:#1a1a1a;">${name}</strong>! 🎉<br>
        Thank you for shopping with Tech4U. Your order has been successfully placed and is being processed.
      </p>

      <!-- Order Info Box -->
      <div style="background:#fafafa;border:1px solid #eee;border-radius:12px;
                  padding:18px 20px;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#666;">Order Number</td>
            <td style="padding:5px 0;font-size:13px;font-weight:700;
                       color:#daa520;text-align:right;font-family:monospace;">
              ${orderNumber}
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#666;">Order Date</td>
            <td style="padding:5px 0;font-size:13px;font-weight:600;
                       color:#333;text-align:right;">${orderDate}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#666;">Payment Method</td>
            <td style="padding:5px 0;font-size:13px;font-weight:600;
                       color:#333;text-align:right;">${paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#666;">Currency</td>
            <td style="padding:5px 0;font-size:13px;font-weight:600;
                       color:#333;text-align:right;">${currencyCode}</td>
          </tr>
        </table>
      </div>

      <!-- ===== ITEMS ORDERED ===== -->
      <h3 style="margin:0 0 14px;font-size:16px;color:#1a1a1a;
                 border-bottom:2px solid #daa520;padding-bottom:10px;">
        🛍️ Items Ordered (${items.length} item${items.length > 1 ? "s" : ""})
      </h3>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="text-align:left;padding:10px 12px;font-size:12px;
                       color:#888;font-weight:600;border-bottom:2px solid #eee;">
              PRODUCT
            </th>
            <th style="text-align:right;padding:10px 12px;font-size:12px;
                       color:#888;font-weight:600;border-bottom:2px solid #eee;">
              AMOUNT
            </th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- ===== ORDER TOTAL ===== -->
      <div style="background:#1a1a1a;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#aaa;">
              Subtotal (${items.length} item${items.length > 1 ? "s" : ""})
            </td>
            <td style="padding:5px 0;font-size:13px;color:#fff;text-align:right;">
              ${convertedTotal}
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#aaa;">Shipping</td>
            <td style="padding:5px 0;font-size:13px;color:#22c55e;
                       text-align:right;font-weight:600;">FREE</td>
          </tr>
          <tr>
            <td style="padding:12px 0 0;font-size:16px;color:#fff;font-weight:700;
                       border-top:1px solid #333;">
              Total Paid
            </td>
            <td style="padding:12px 0 0;font-size:20px;color:#daa520;
                       font-weight:800;text-align:right;border-top:1px solid #333;">
              ${convertedTotal}
            </td>
          </tr>
        </table>
      </div>

      <!-- ===== SHIPPING ADDRESS ===== -->
      <div style="border:1px solid #eee;border-radius:12px;padding:18px 20px;margin-bottom:28px;">
        <p style="margin:0 0 12px;font-weight:700;font-size:14px;color:#1a1a1a;">
          📍 Shipping Address
        </p>
        <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">
          ${shippingAddress.split(", ").join("<br>")}
        </p>
      </div>

      <!-- ===== PERKS ===== -->
      <div style="display:flex;gap:8px;margin-bottom:28px;flex-wrap:wrap;">
        <div style="flex:1;min-width:120px;background:#f9f9f9;border-radius:10px;
                    padding:12px;text-align:center;font-size:12px;color:#555;">
          🔒<br><strong>Secure Payment</strong>
        </div>
        <div style="flex:1;min-width:120px;background:#f9f9f9;border-radius:10px;
                    padding:12px;text-align:center;font-size:12px;color:#555;">
          🚚<br><strong>Free Shipping</strong>
        </div>
        <div style="flex:1;min-width:120px;background:#f9f9f9;border-radius:10px;
                    padding:12px;text-align:center;font-size:12px;color:#555;">
          ↩<br><strong>30-Day Returns</strong>
        </div>
        <div style="flex:1;min-width:120px;background:#f9f9f9;border-radius:10px;
                    padding:12px;text-align:center;font-size:12px;color:#555;">
          ✦<br><strong>Luxury Packaging</strong>
        </div>
      </div>

      <!-- ===== TRACKING NOTE ===== -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;
                  padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#92400e;">
          📦 <strong>What's next?</strong> We are preparing your order. Once shipped, you'll
          receive tracking information via WhatsApp on your registered number.
        </p>
      </div>

      <!-- Footer contact -->
      <div style="border-top:1px solid #eee;padding-top:20px;">
        <p style="margin:0 0 6px;font-size:14px;"><strong>Best regards,</strong><br>
        <span style="color:#daa520;font-weight:700;">Tech4U Team</span></p>
        <p style="margin:0;color:#888;font-size:12px;line-height:1.8;">
          📧 Support: info@tech4ru.com<br>
          🌐 Website: tech4ru.com
        </p>
      </div>
    </div>

    <!-- ===== FOOTER ===== -->
    <div style="background:#1a1a1a;padding:16px;text-align:center;">
      <p style="margin:0;color:#555;font-size:11px;">
        © 2025 Tech4U. All rights reserved. | SSL Secured Checkout
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================
// TEXT EMAIL (fallback)
// ============================================
function buildCustomerEmailText(
  name: string,
  orderNumber: string,
  orderDate: string,
  items: any[],
  totalPKR: number,
  currencyCode: string,
  shippingAddress: string,
  paymentMethod: string
): string {
  const itemsList = items
    .map((item: any, index: number) => {
      const itemTotalPKR = item.pricePKR || item.price;
      const convertedPrice = formatPriceWithCurrency(
        itemTotalPKR,
        currencyCode
      );
      const ppu = item.piecesPerUnit || 1;
      const totalPieces = ppu * item.quantity;
      let line = `${index + 1}. ${item.name}`;
      if (item.variant && item.variant !== "Standard")
        line += ` (${item.variant})`;
      line += ` — Qty: ${item.quantity} unit${item.quantity > 1 ? "s" : ""}`;
      if (ppu > 1) line += ` × ${ppu} pieces = ${totalPieces} total pieces`;
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
📧 Support: info@tech4ru.com
🌐 Website: tech4ru.com`;
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
    console.log("========================================");

    if (!email || !phone || !name || !orderNumber) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    let emailSent = false;
    let whatsappSent = false;

    // ==========================================
    // STEP 1: EMAIL → CUSTOMER (with full cart)
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
        paymentMethod || "Card"
      );
      const emailHtml = buildCustomerEmailHtml(
        name,
        orderNumber,
        orderDate,
        items,
        total,
        currencyCode,
        shippingAddress || "",
        paymentMethod || "Card"
      );

      await transporter.sendMail({
        from: `"Tech4U Orders" <${
          process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
        }>`,
        to: email,
        replyTo: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        subject: `✅ Order Confirmed #${orderNumber} — Tech4U`,
        text: emailText,
        html: emailHtml,
        headers: {
          "X-Mailer": "Tech4U-Mailer-1.0",
          "X-Priority": "1",
          "Message-ID": `<order-${orderNumber}-${Date.now()}@tech4u.com>`,
        },
      });

      console.log("✅ EMAIL SENT to:", email);
      emailSent = true;
    } catch (emailError: any) {
      console.error("❌ EMAIL FAILED:", emailError.message);
      emailSent = false;
    }

    // ==========================================
    // STEP 2: WHATSAPP → CUSTOMER (full details)
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
        paymentMethod || "Card"
      );
      whatsappSent = await sendWhatsAppViaGreenAPI(phone, waMessage);
      console.log(
        `📱 WhatsApp ${whatsappSent ? "✅ SENT" : "❌ FAILED"} to: ${phone}`
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
        currencyCode
      );

      const itemsAdminHtml = items
        .map((item: any) => {
          const ppu = item.piecesPerUnit || 1;
          const totalPieces = ppu * item.quantity;
          const hasImage =
            item.image &&
            item.image !== "null" &&
            item.image !== "" &&
            item.image !== null;
          return `
          <tr>
            <td style="padding:12px;border-bottom:1px solid #eee;vertical-align:middle;">
              <div style="display:flex;align-items:center;gap:10px;">
                ${
                  hasImage
                    ? `<img src="${item.image}" width="50" height="50"
                        style="border-radius:8px;object-fit:cover;" />`
                    : `<div style="width:50px;height:50px;background:#f5f5f5;border-radius:8px;
                                    display:flex;align-items:center;justify-content:center;font-size:20px;">📦</div>`
                }
                <div>
                  <strong>${item.name}</strong>${
            item.variant ? ` (${item.variant})` : ""
          }
                  ${
                    ppu > 1
                      ? `<br><span style="font-size:11px;color:#888;">${ppu} pieces/unit = ${totalPieces} total pieces</span>`
                      : ""
                  }
                </div>
              </div>
            </td>
            <td style="text-align:center;padding:12px;border-bottom:1px solid #eee;">
              x${item.quantity}
            </td>
            <td style="text-align:right;padding:12px;border-bottom:1px solid #eee;">
              <strong>${formatPriceWithCurrency(
                item.pricePKR || item.price,
                currencyCode
              )}</strong>
              <br><span style="font-size:10px;color:#aaa;">PKR ${(
                item.pricePKR || item.price
              ).toLocaleString()}</span>
            </td>
          </tr>
        `;
        })
        .join("");

      await transporter.sendMail({
        from: `"Tech4U System" <${
          process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
        }>`,
        to: ownerEmail,
        subject: `🔔 NEW ORDER #${orderNumber} — ${convertedTotalDisplay} (${currencyCode}) — ${name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:2px solid #daa520;">
            <div style="background:#1a1a1a;padding:20px;text-align:center;">
              <h2 style="margin:0;color:#daa520;">🛍️ NEW ORDER</h2>
              <p style="margin:5px 0 0;color:#888;">Order #${orderNumber}</p>
              <p style="margin:5px 0 0;color:#daa520;font-size:12px;">
                Currency: ${currencyCode} | Total: ${convertedTotalDisplay}
              </p>
            </div>
            <div style="padding:20px;">
              <p><strong>Customer:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Date:</strong> ${orderDate}</p>
              <p><strong>Payment:</strong> ${paymentMethod}</p>
              <p><strong>Address:</strong> ${shippingAddress}</p>
              
              <h3>Items (${items.length}):</h3>
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr>
                    <th style="text-align:left;padding:8px;">Product</th>
                    <th style="text-align:center;padding:8px;">Qty</th>
                    <th style="text-align:right;padding:8px;">Amount (${currencyCode})</th>
                  </tr>
                </thead>
                <tbody>${itemsAdminHtml}</tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="text-align:right;padding:12px;"><strong>TOTAL:</strong></td>
                    <td style="text-align:right;padding:12px;">
                      <strong style="color:#daa520;">${formatPriceWithCurrency(
                        total,
                        currencyCode
                      )}</strong>
                      <br><span style="font-size:11px;color:#888;">PKR ${total.toLocaleString()}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
              
              <p style="margin-top:20px;font-size:12px;color:#888;">
                ✅ Email sent to customer: ${emailSent ? "Yes" : "No"}<br>
                ✅ WhatsApp sent to customer: ${whatsappSent ? "Yes" : "No"}
              </p>
            </div>
          </div>
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
        ? `✅ Email sent to ${email}` +
          (whatsappSent
            ? ` | ✅ WhatsApp sent to ${phone}`
            : ` | ⚠️ WhatsApp not delivered (customer may not have WhatsApp)`)
        : "❌ Email failed — check SMTP_PASS in .env.local",
    });
  } catch (error: any) {
    console.error("❌ ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
