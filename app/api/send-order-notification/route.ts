// app/api/send-order-notification/route.ts
// ✅ UPDATED: Uses exact same conversion logic as CartSummary/CurrencyContext

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
// Helper: Get currency by code (same as CurrencyContext)
// ============================================
function getCurrencyByCode(currencyCode: string): Currency {
  return currencies.find((c) => c.code === currencyCode) || currencies[0];
}

// ============================================
// Helper: Convert price using exact same logic as frontend
// ============================================
function convertPriceToCurrency(
  priceInPKR: number,
  currencyCode: string
): number {
  const currency = getCurrencyByCode(currencyCode);
  return convertPrice(priceInPKR, currency);
}

// ============================================
// Helper: Format price using exact same logic as frontend
// ============================================
function formatPriceWithCurrency(
  priceInPKR: number,
  currencyCode: string
): string {
  const currency = getCurrencyByCode(currencyCode);
  return formatPrice(priceInPKR, currency);
}

// ============================================
// PHONE NUMBER FORMATTER
// ============================================
function formatPhoneForWhatsApp(phoneNumber: string): string {
  let clean = phoneNumber.replace(/\D/g, "");
  if (clean.startsWith("0") && clean.length === 11) {
    clean = "92" + clean.slice(1);
  }
  const chatId = `${clean}@c.us`;
  console.log(`📱 Phone format: "${phoneNumber}" → "${chatId}"`);
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
    console.error("❌ GREEN_API credentials missing in .env.local!");
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
// ✅ WHATSAPP MESSAGE — Using same currency logic as CartSummary
// ============================================
function buildWhatsAppMessage(
  name: string,
  orderNumber: string,
  orderDate: string,
  items: any[],
  totalPKR: number,
  currencyCode: string
): string {
  // Build items list with converted prices (same as frontend CartSummary)
  const itemsList = items
    .map((item: any) => {
      const itemTotalPKR = item.pricePKR || item.price;
      const convertedPrice = formatPriceWithCurrency(
        itemTotalPKR,
        currencyCode
      );
      return `• ${item.name}${item.variant ? ` (${item.variant})` : ""} x${
        item.quantity
      } — ${convertedPrice}`;
    })
    .join("\n");

  const convertedTotal = formatPriceWithCurrency(totalPKR, currencyCode);

  return `Thank you for shopping with Tech4U! 🎉

Your order has been successfully placed. Below are your order details:

Order Number: ${orderNumber}
Order Date: ${orderDate}

Items Ordered:
${itemsList}

Total Amount: ${convertedTotal}

We are currently processing your order and will notify you once it has been shipped. You can expect delivery within the estimated time mentioned on our website.

If you have any questions or need assistance, feel free to contact our support team.

Thank you for choosing Tech4U. We truly appreciate your trust in us!

Best regards,
Tech4U Team
📧 Support: info@tech4ru.com
🌐 Website: tech4ru.com`;
}

// ============================================
// ✅ HTML EMAIL — Using same currency logic as CartSummary
// ============================================
function buildCustomerEmailHtml(
  name: string,
  orderNumber: string,
  orderDate: string,
  items: any[],
  totalPKR: number,
  currencyCode: string
): string {
  const convertedTotal = formatPriceWithCurrency(totalPKR, currencyCode);
  const currency = getCurrencyByCode(currencyCode);

  const itemsHtml = items
    .map((item: any) => {
      const itemTotalPKR = item.pricePKR || item.price;
      const convertedPrice = formatPriceWithCurrency(
        itemTotalPKR,
        currencyCode
      );

      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #eee;">
            ${
              item.image && item.image !== "null" && item.image !== ""
                ? `<img src="${item.image}" width="50" height="50" style="border-radius:8px;object-fit:cover;margin-right:12px;vertical-align:middle;" />`
                : ""
            }
            <strong>${item.name}</strong>${
        item.variant ? ` (${item.variant})` : ""
      }
          </td>
          <td style="text-align:center;padding:12px;border-bottom:1px solid #eee;">x${
            item.quantity
          }</td>
          <td style="text-align:right;padding:12px;border-bottom:1px solid #eee;">${convertedPrice}</td>
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
  <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background:#1a1a1a;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#daa520;font-size:28px;">TECH4U</h1>
      <p style="margin:10px 0 0;color:#888;font-size:12px;">Order Confirmation — ${currencyCode}</p>
    </div>

    <!-- Content -->
    <div style="padding:30px;">
      <p style="font-size:16px;margin:0 0 20px;">Thank you for shopping with Tech4U! 🎉</p>
      
      <p style="margin:0 0 20px;">Your order has been successfully placed. Below are your order details:</p>
      
      <div style="background:#f9f9f9;padding:15px;border-radius:10px;margin-bottom:20px;">
        <p style="margin:0 0 8px;"><strong>Order Number:</strong> ${orderNumber}</p>
        <p style="margin:0;"><strong>Order Date:</strong> ${orderDate}</p>
      </div>
      
      <h3 style="margin:0 0 15px;">Items Ordered:</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr><th style="text-align:left;padding:8px;border-bottom:2px solid #daa520;">Product</th>
            <th style="text-align:center;padding:8px;border-bottom:2px solid #daa520;">Qty</th>
            <th style="text-align:right;padding:8px;border-bottom:2px solid #daa520;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr><td colspan="2" style="text-align:right;padding:12px;"><strong>Total Amount:</strong></td>
            <td style="text-align:right;padding:12px;"><strong style="color:#daa520;">${convertedTotal}</strong></td>
          </tr>
        </tfoot>
      </table>
      
      <p style="margin:0 0 15px;">We are currently processing your order and will notify you once it has been shipped. You can expect delivery within the estimated time mentioned on our website.</p>
      
      <p style="margin:0 0 15px;">If you have any questions or need assistance, feel free to contact our support team.</p>
      
      <p style="margin:0 0 10px;">Thank you for choosing Tech4U. We truly appreciate your trust in us!</p>
      
      <div style="margin-top:25px;padding-top:20px;border-top:1px solid #eee;">
        <p style="margin:0;"><strong>Best regards,</strong><br>Tech4U Team</p>
        <p style="margin:10px 0 0;color:#888;font-size:12px;">
          📧 Support: info@tech4ru.com<br>
          🌐 Website: tech4ru.com
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ============================================
// ✅ TEXT EMAIL — Using same currency logic as CartSummary
// ============================================
function buildCustomerEmailText(
  name: string,
  orderNumber: string,
  orderDate: string,
  items: any[],
  totalPKR: number,
  currencyCode: string
): string {
  const itemsList = items
    .map((item: any) => {
      const itemTotalPKR = item.pricePKR || item.price;
      const convertedPrice = formatPriceWithCurrency(
        itemTotalPKR,
        currencyCode
      );
      return `• ${item.name}${item.variant ? ` (${item.variant})` : ""} x${
        item.quantity
      } — ${convertedPrice}`;
    })
    .join("\n");

  const convertedTotal = formatPriceWithCurrency(totalPKR, currencyCode);

  return `Thank you for shopping with Tech4U! 🎉

Your order has been successfully placed. Below are your order details:

Order Number: ${orderNumber}
Order Date: ${orderDate}

Items Ordered:
${itemsList}

Total Amount: ${convertedTotal}

We are currently processing your order and will notify you once it has been shipped. You can expect delivery within the estimated time mentioned on our website.

If you have any questions or need assistance, feel free to contact our support team.

Thank you for choosing Tech4U. We truly appreciate your trust in us!

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
      currency: currencyCode = "PKR", // ✅ Customer's detected currency from frontend
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
    console.log("📱 WhatsApp:", phone);
    console.log("💰 Total PKR:", total);
    console.log("🌍 Display Currency:", currencyCode);
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
    // STEP 1: EMAIL → CUSTOMER (with detected currency)
    // ==========================================
    try {
      const emailText = buildCustomerEmailText(
        name,
        orderNumber,
        orderDate,
        items,
        total,
        currencyCode
      );
      const emailHtml = buildCustomerEmailHtml(
        name,
        orderNumber,
        orderDate,
        items,
        total,
        currencyCode
      );
      const convertedTotal = formatPriceWithCurrency(total, currencyCode);

      await transporter.sendMail({
        from: `"Tech4U Orders" <${
          process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
        }>`,
        to: email,
        replyTo: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        subject: `✅ Your Tech4U Order #${orderNumber} is Confirmed! (${currencyCode} ${convertedTotal})`,
        text: emailText,
        html: emailHtml,
        headers: {
          "X-Mailer": "Tech4U-Mailer-1.0",
          "X-Priority": "1",
          "X-Email-Type": "order-confirmation",
          "Message-ID": `<order-${orderNumber}-${Date.now()}@tech4u.com>`,
        },
      });

      console.log("✅ EMAIL SENT:", email);
      emailSent = true;
    } catch (emailError: any) {
      console.error("❌ EMAIL FAILED:", emailError.message);
      emailSent = false;
    }

    // ==========================================
    // STEP 2: WHATSAPP → CUSTOMER (with detected currency)
    // ==========================================
    try {
      const waMessage = buildWhatsAppMessage(
        name,
        orderNumber,
        orderDate,
        items,
        total,
        currencyCode
      );
      whatsappSent = await sendWhatsAppViaGreenAPI(phone, waMessage);
      console.log(`📱 WhatsApp ${whatsappSent ? "SENT" : "FAILED"}`);
    } catch (waError: any) {
      console.error("❌ WHATSAPP ERROR:", waError.message);
      whatsappSent = false;
    }

    // ==========================================
    // STEP 3: ADMIN ALERT → OWNER EMAIL (Always in PKR for tracking)
    // ==========================================
    try {
      const ownerEmail = process.env.OWNER_EMAIL || process.env.SMTP_USER;
      const convertedTotalDisplay = formatPriceWithCurrency(
        total,
        currencyCode
      );

      const itemsAdminHtml = items
        .map(
          (item: any) => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;">
              <strong>${item.name}</strong>${
            item.variant ? ` (${item.variant})` : ""
          }
              <br><span style="font-size:11px;color:#888;">PKR ${(
                item.pricePKR || item.price
              ).toLocaleString()}</span>
            </td>
            <td style="text-align:center;padding:10px;border-bottom:1px solid #eee;">x${
              item.quantity
            }</td>
            <td style="text-align:right;padding:10px;border-bottom:1px solid #eee;">
              <strong>${formatPriceWithCurrency(
                item.pricePKR || item.price,
                currencyCode
              )}</strong>
              <br><span style="font-size:10px;color:#aaa;">PKR ${(
                item.pricePKR || item.price
              ).toLocaleString()}</span>
            </td>
          </tr>
        `
        )
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
                Customer Currency: ${currencyCode} | Total: ${convertedTotalDisplay}
              </p>
            </div>
            <div style="padding:20px;">
              <p><strong>Customer:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Date:</strong> ${orderDate}</p>
              <p><strong>Payment:</strong> ${paymentMethod}</p>
              <p><strong>Address:</strong> ${shippingAddress}</p>
              
              <h3>Items:</h3>
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr><th style="text-align:left;">Product</th><th>Qty</th><th style="text-align:right;">Amount (${currencyCode})</th></tr>
                </thead>
                <tbody>${itemsAdminHtml}</tbody>
                <tfoot>
                  <tr><td colspan="2" style="text-align:right;padding:12px;"><strong>TOTAL:</strong></td>
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
            : ` | ⚠️ WhatsApp failed`)
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
