// app/api/send-order-notification/route.ts
// ✅ WASENDERAPI WHATSAPP — ALL Countries Work
// UK +44, USA +1, Australia +61, Pakistan +92 — sab
// Unlimited messages — $6/month — No sandbox, No join needed
// wasenderapi.com

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  currencies,
  Currency,
  convertPrice,
  formatPrice,
} from "@/lib/currency";
import { sendOrderWhatsApp } from "@/lib/whatsapp";

// ============================================
// SMTP EMAIL SETUP — FIXED FOR ALL EMAIL PROVIDERS
// Works with: Hotmail, Gmail, Yahoo, iCloud, info.com, custom domains
// Australia, USA, UK — SABI countries ke emails deliver hote hain
// ============================================
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // ✅ MUST be false for port 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
    // ✅ Timeouts — prevent hanging
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
    // ✅ NO pool — fresh connection each time (more reliable for delivery)
    pool: false,
  });
}

// ============================================
// Currency helpers
// ============================================
function getCurrencyByCode(currencyCode: string): Currency {
  return currencies.find((c) => c.code === currencyCode) || currencies[0];
}

function formatPriceWithCurrency(
  priceInPKR: number,
  currencyCode: string,
): string {
  return formatPrice(priceInPKR, getCurrencyByCode(currencyCode));
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
// EMAIL HTML BUILDER
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
                                 border:1px solid #eee;" alt="${item.name}" />`
                      : `<div style="width:72px;height:72px;border-radius:10px;background:#f5f5f5;
                                   text-align:center;font-size:28px;line-height:72px;">&#128230;</div>`
                  }
                </td>
                <td style="vertical-align:top;">
                  <p style="margin:0 0 5px;font-weight:700;font-size:14px;color:#1a1a1a;">
                    ${item.name}
                  </p>
                  ${
                    item.variant && item.variant !== "Standard"
                      ? `<p style="margin:0 0 4px;font-size:12px;color:#888;">Variant: ${item.variant}</p>`
                      : ""
                  }
                  <p style="margin:0;font-size:12px;color:#666;">
                    Qty: ${item.quantity} unit${item.quantity > 1 ? "s" : ""}
                    ${ppu > 1 ? `x ${ppu} pieces = ${totalPieces} total` : ""}
                  </p>
                  <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#b8860b;">
                    ${convertedPrice}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Order Confirmed - Tech4U</title>
  </head>
  <body style="margin:0;padding:0;background:#f8f8f8;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;padding:20px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:32px;text-align:center;">
              <h1 style="color:#daa520;margin:0;font-size:28px;letter-spacing:2px;">TECH4U</h1>
              <p style="color:#ffffff;margin:8px 0 0;font-size:14px;opacity:0.8;">Order Confirmed &#10003;</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 0;">
              <h2 style="color:#1a1a1a;margin:0 0 8px;font-size:20px;">Hello ${name}!</h2>
              <p style="color:#666;margin:0;font-size:14px;line-height:1.6;">
                Thank you for your purchase! Your order has been confirmed and is being processed.
              </p>
            </td>
          </tr>

          <!-- Order Info -->
          <tr>
            <td style="padding:20px 32px;">
              <table width="100%" cellpadding="8" cellspacing="0" style="background:#f9f6f0;border-radius:12px;">
                <tr>
                  <td style="font-size:13px;color:#666;">Order Number</td>
                  <td style="font-size:13px;font-weight:700;color:#1a1a1a;text-align:right;">#${orderNumber}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#666;">Order Date</td>
                  <td style="font-size:13px;color:#1a1a1a;text-align:right;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#666;">Payment</td>
                  <td style="font-size:13px;color:#1a1a1a;text-align:right;">${paymentMethod}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:0 32px;">
              <h3 style="color:#1a1a1a;font-size:15px;margin:0 0 12px;">Your Items</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:12px;overflow:hidden;">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- Total -->
          <tr>
            <td style="padding:16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#666;">Shipping</td>
                  <td style="font-size:13px;color:#2e7d32;font-weight:600;text-align:right;">FREE</td>
                </tr>
                <tr>
                  <td style="font-size:16px;font-weight:700;color:#1a1a1a;padding-top:8px;">Total</td>
                  <td style="font-size:18px;font-weight:700;color:#b8860b;text-align:right;padding-top:8px;">${convertedTotal}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Address -->
          <tr>
            <td style="padding:0 32px 28px;">
              <div style="background:#f9f6f0;border-radius:12px;padding:16px;">
                <p style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.05em;">Delivery Address</p>
                <p style="margin:0;font-size:13px;color:#1a1a1a;line-height:1.6;">${shippingAddress}</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;padding:24px 32px;text-align:center;">
              <p style="color:#daa520;margin:0 0 8px;font-size:13px;font-weight:600;">TECH4U</p>
              <p style="color:#888;margin:0;font-size:12px;">info@tech4ru.com | tech4ru.com</p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

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
      line += ` — Qty: ${item.quantity}`;
      if (ppu > 1) line += ` x ${ppu} = ${totalPieces} total`;
      line += ` — ${convertedPrice}`;
      return line;
    })
    .join("\n");

  const convertedTotal = formatPriceWithCurrency(totalPKR, currencyCode);
  return `Hello ${name}! Thank you for shopping with Tech4U!\n\nOrder #: ${orderNumber}\nDate: ${orderDate}\nPayment: ${paymentMethod}\n\nItems:\n${itemsList}\n\nShipping: FREE\nTotal: ${convertedTotal}\n\nDelivery Address:\n${shippingAddress}\n\nBest regards,\nTech4U Team\ninfo@tech4ru.com`;
}

function buildAdminItemsHtml(items: any[], currencyCode: string): string {
  return items
    .map((item: any) => {
      const ppu = item.piecesPerUnit || 1;
      const totalPieces = ppu * item.quantity;
      const hasImage = isValidPublicImageUrl(item.image);
      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #eee;">
            ${hasImage ? `<img src="${item.image}" width="50" height="50" style="border-radius:8px;vertical-align:middle;margin-right:8px;" />` : "📦"}
            <strong>${item.name}</strong>
            ${item.variant ? ` <span style="color:#888;">(${item.variant})</span>` : ""}
            ${ppu > 1 ? `<br><small>${ppu} pcs/unit = ${totalPieces} total</small>` : ""}
          </td>
          <td style="text-align:center;padding:12px;">x${item.quantity}</td>
          <td style="text-align:right;padding:12px;">
            <strong>${formatPriceWithCurrency(item.pricePKR || item.price, currencyCode)}</strong>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ============================================
// SEND EMAIL WITH RETRY — works for ALL providers
// Hotmail, Gmail, Yahoo, iCloud, custom domains
// ============================================
async function sendEmailWithRetry(
  mailOptions: nodemailer.SendMailOptions,
  retries = 3,
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    // ✅ Fresh transporter every time — prevents stale connection issues
    const transporter = createTransporter();
    try {
      console.log(`📧 Email attempt ${attempt}/${retries} → ${mailOptions.to}`);

      // ✅ Verify SMTP connection first
      await transporter.verify();

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to: ${mailOptions.to}`);
      transporter.close();
      return true;
    } catch (error: any) {
      console.error(`❌ Email attempt ${attempt} failed:`, error.message);
      try {
        transporter.close();
      } catch {}

      if (attempt < retries) {
        // Wait before retry: 2s, 4s, 8s
        const delay = attempt * 2000;
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  console.error(
    `❌ All ${retries} email attempts failed for: ${mailOptions.to}`,
  );
  return false;
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
    console.log("🚀 NEW ORDER NOTIFICATION (WasenderAPI WhatsApp)");
    console.log("📦 Order:", orderNumber);
    console.log("👤 Customer:", name);
    console.log("📧 Email:", email);
    console.log("📱 Phone (raw):", phone);
    console.log("💰 Total PKR:", total);
    console.log("🌍 Currency:", currencyCode);
    console.log("========================================");

    if (!email || !phone || !name || !orderNumber) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // ✅ Validate email format before sending
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ Invalid email format:", email);
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 },
      );
    }

    let emailSent = false;
    let whatsappSent = false;

    // ==========================================
    // STEP 1: EMAIL TO CUSTOMER
    // Works for: Hotmail, Gmail, Yahoo, iCloud, any domain
    // Australia, USA, UK — all countries
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

      const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
      const fromName = "Tech4U Orders";

      emailSent = await sendEmailWithRetry({
        from: `"${fromName}" <${fromEmail}>`,
        to: email, // ✅ Customer ka email — koi bhi ho
        replyTo: `"Tech4U Support" <${fromEmail}>`,
        subject: `Your Order #${orderNumber} is Confirmed - Tech4U`,
        text: emailText, // ✅ Plain text fallback — critical for deliverability
        html: emailHtml,
        headers: {
          // ✅ These headers tell spam filters this is a legit transactional email
          "X-Mailer": "Tech4U-Order-System",
          "X-Transaction-Email": "true",
          Precedence: "transactional",
          "X-Priority": "1",
          Importance: "High",
          // ✅ Unique Message-ID prevents duplicate detection
          "Message-ID": `<order-${orderNumber}-${Date.now()}@tech4ru.com>`,
        },
      });
    } catch (emailError: any) {
      console.error("❌ EMAIL STEP FAILED:", emailError.message);
      emailSent = false;
    }

    // ==========================================
    // STEP 2: WHATSAPP VIA WASENDERAPI
    // ==========================================
    try {
      console.log(`📱 Sending WhatsApp via WasenderAPI to: ${phone}`);

      const formattedItems = (items || []).map((item: any) => ({
        name: item.name,
        variant: item.variant,
        quantity: item.quantity,
        formattedPrice: formatPriceWithCurrency(
          item.pricePKR || item.price,
          currencyCode,
        ),
      }));

      const formattedTotal = formatPriceWithCurrency(total, currencyCode);

      whatsappSent = await sendOrderWhatsApp(
        phone,
        orderNumber,
        name,
        total,
        items || [],
        formattedTotal,
        formattedItems,
      );

      console.log(
        `📱 WasenderAPI WhatsApp ${whatsappSent ? "✅ SENT" : "❌ FAILED"}`,
      );
    } catch (waError: any) {
      console.error("❌ WHATSAPP ERROR:", waError.message);
      whatsappSent = false;
    }

    // ==========================================
    // STEP 3: ADMIN ALERT EMAIL
    // ==========================================
    try {
      const ownerEmail = process.env.OWNER_EMAIL || process.env.SMTP_USER;
      const convertedTotalDisplay = formatPriceWithCurrency(
        total,
        currencyCode,
      );
      const itemsAdminHtml = buildAdminItemsHtml(items, currencyCode);
      const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

      await sendEmailWithRetry({
        from: `"Tech4U System" <${fromEmail}>`,
        to: ownerEmail,
        subject: `🛍️ NEW ORDER #${orderNumber} — ${convertedTotalDisplay} (${currencyCode}) — ${name}`,
        html: `
          <h2>&#128722; NEW ORDER #${orderNumber}</h2>
          <p><strong>Customer:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Date:</strong> ${orderDate}</p>
          <p><strong>Payment:</strong> ${paymentMethod}</p>
          <p><strong>Address:</strong> ${shippingAddress}</p>
          <h3>Items:</h3>
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th>Product</th><th>Qty</th><th>Amount</th>
              </tr>
            </thead>
            <tbody>${itemsAdminHtml}</tbody>
          </table>
          <p><strong>Total: ${convertedTotalDisplay}</strong></p>
          <hr>
          <p>&#128231; Email to customer: ${emailSent ? "✅ Sent" : "❌ Failed"}</p>
          <p>&#128172; WhatsApp to customer: ${whatsappSent ? "✅ Sent" : "❌ Failed"}</p>
        `,
        text: `NEW ORDER #${orderNumber}\nCustomer: ${name}\nEmail: ${email}\nPhone: ${phone}\nTotal: ${convertedTotalDisplay}\nEmail Sent: ${emailSent}\nWhatsApp Sent: ${whatsappSent}`,
      });
      console.log("📧 Admin alert sent");
    } catch (adminErr: any) {
      console.error("❌ Admin alert failed:", adminErr.message);
    }

    return NextResponse.json({
      success: emailSent || whatsappSent,
      emailSent,
      whatsappSent,
      message: `Email: ${emailSent ? "Sent ✅" : "Failed ❌"}, WhatsApp: ${whatsappSent ? "Sent ✅" : "Failed ❌"}`,
    });
  } catch (error: any) {
    console.error("❌ ROUTE ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
