// app/api/send-order-notification/route.ts
// ✅ UPDATED — Cart images in email, luxury email template

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

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
// WHATSAPP MESSAGE — Customer ke liye
// ============================================
function buildWhatsAppMessage(
  name: string,
  orderNumber: string,
  total: number,
  items: any[],
  shippingAddress: string,
  paymentMethod: string
): string {
  const itemsList = items
    .map(
      (item: any) =>
        `• ${item.name}${item.variant ? ` (${item.variant})` : ""} x${
          item.quantity
        } — PKR ${item.price.toLocaleString()}`
    )
    .join("\n");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return `🛍️ *TECH4U — Order Confirmed!*

Dear *${name}*,

✅ Aapka order successfully place ho gaya hai!

━━━━━━━━━━━━━━━━━━━━
📦 *Order:* ${orderNumber}
💰 *Total:* PKR ${total.toLocaleString()}
💳 *Payment:* ${paymentMethod}
━━━━━━━━━━━━━━━━━━━━

🛒 *Items:*
${itemsList}

📍 *Delivery Address:*
${shippingAddress}

🔗 Track your order:
${appUrl}/orders/${orderNumber}

Shukriya Tech4U se shopping karne ka! ✨
Koi sawal ho to reply karein.`;
}

// ============================================
// CUSTOMER EMAIL HTML — Luxury design with cart images
// ============================================
function buildCustomerEmailHtml(
  name: string,
  orderNumber: string,
  items: any[],
  subtotal: number,
  shipping: number,
  total: number,
  shippingAddress: string,
  paymentMethod: string
): string {
  const orderDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const itemsHtml = items
    .map(
      (item: any) => `
      <tr>
        <td style="padding:16px 12px;border-bottom:1px solid #f0ece0;vertical-align:middle;">
          <div style="display:flex;align-items:center;gap:14px;">
            ${
              item.image
                ? `<div style="width:64px;height:64px;border-radius:10px;overflow:hidden;flex-shrink:0;border:1px solid #e8e0cc;background:#f9f6f0;">
                    <img src="${item.image}" alt="${item.name}" width="64" height="64" style="object-fit:cover;display:block;width:64px;height:64px;" />
                  </div>`
                : `<div style="width:64px;height:64px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,#f5f0e8,#ebe3d0);border:1px solid #e0d8c8;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:24px;">📦</span>
                  </div>`
            }
            <div>
              <div style="font-size:14px;font-weight:700;color:#1a1a1a;margin-bottom:3px;font-family:'Georgia',serif;">${
                item.name
              }</div>
              ${
                item.variant
                  ? `<div style="font-size:12px;color:#888;margin-bottom:2px;">${item.variant}</div>`
                  : ""
              }
              ${
                item.piecesPerUnit > 1
                  ? `<div style="font-size:11px;color:#aaa;">${item.piecesPerUnit}-Piece Set</div>`
                  : ""
              }
              <div style="font-size:12px;color:#b8960c;margin-top:2px;">Qty: ${
                item.quantity
              }</div>
            </div>
          </div>
        </td>
        <td style="text-align:right;padding:16px 12px;border-bottom:1px solid #f0ece0;vertical-align:middle;font-size:15px;font-weight:700;color:#1a1a1a;white-space:nowrap;">
          PKR ${item.price.toLocaleString()}
        </td>
      </tr>`
    )
    .join("");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Order Confirmation #${orderNumber} — Tech4U</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Segoe UI',Georgia,Arial,sans-serif;">

  <div style="max-width:620px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.12);">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#0f0f0f 0%,#1e1e1e 50%,#0f0f0f 100%);padding:40px 32px 32px;text-align:center;border-bottom:3px solid #daa520;">
      <div style="font-size:10px;letter-spacing:6px;color:#888;text-transform:uppercase;margin-bottom:10px;">Premium Tech Store</div>
      <div style="font-size:40px;font-weight:900;color:#daa520;letter-spacing:6px;font-family:'Georgia',serif;">TECH4U</div>
      <div style="width:50px;height:2px;background:linear-gradient(90deg,transparent,#daa520,transparent);margin:14px auto;"></div>
      <div style="font-size:11px;letter-spacing:4px;color:#666;text-transform:uppercase;">Order Confirmation</div>
    </div>

    <!-- HERO MESSAGE -->
    <div style="padding:36px 32px 24px;text-align:center;background:linear-gradient(180deg,#fffdf7 0%,#fff 100%);">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#daa520,#f0c040);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(218,165,32,0.35);">
        <span style="font-size:28px;">✓</span>
      </div>
      <h1 style="margin:0 0 10px;font-size:26px;font-weight:900;color:#1a1a1a;font-family:'Georgia',serif;">Order Successfully Placed!</h1>
      <p style="margin:0;font-size:14px;color:#666;line-height:1.7;">
        Dear <strong style="color:#1a1a1a;">${name}</strong>, thank you for shopping with Tech4U.<br>
        Your order has been confirmed and is being processed.
      </p>
    </div>

    <!-- ORDER INFO STRIP -->
    <div style="background:#1a1a1a;padding:20px 32px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
      <div style="text-align:center;">
        <div style="font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-bottom:4px;">Order Number</div>
        <div style="font-size:15px;font-weight:800;color:#daa520;letter-spacing:1px;">${orderNumber}</div>
      </div>
      <div style="width:1px;height:36px;background:#333;"></div>
      <div style="text-align:center;">
        <div style="font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-bottom:4px;">Order Date</div>
        <div style="font-size:13px;font-weight:600;color:#ccc;">${orderDate}</div>
      </div>
      <div style="width:1px;height:36px;background:#333;"></div>
      <div style="text-align:center;">
        <div style="font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-bottom:4px;">Payment</div>
        <div style="font-size:12px;font-weight:600;color:#ccc;">${paymentMethod}</div>
      </div>
    </div>

    <!-- ITEMS -->
    <div style="padding:28px 32px 0;">
      <h3 style="margin:0 0 16px;font-size:12px;letter-spacing:3px;color:#888;text-transform:uppercase;font-weight:600;">Items Ordered</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- TOTALS -->
    <div style="margin:0 32px 28px;background:#faf6ee;border-radius:14px;padding:20px 24px;border:1px solid #f0e8d0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:13px;color:#666;">Subtotal</span>
        <span style="font-size:13px;color:#1a1a1a;font-weight:600;">PKR ${subtotal.toLocaleString()}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:14px;">
        <span style="font-size:13px;color:#666;">Shipping</span>
        <span style="font-size:13px;color:#1a1a1a;font-weight:600;">${
          shipping === 0 ? "FREE" : `PKR ${shipping.toLocaleString()}`
        }</span>
      </div>
      <div style="height:1px;background:linear-gradient(90deg,transparent,#daa520,transparent);margin-bottom:14px;"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;font-weight:700;color:#1a1a1a;letter-spacing:1px;">TOTAL PAID</span>
        <span style="font-size:24px;font-weight:900;color:#daa520;font-family:'Georgia',serif;">PKR ${total.toLocaleString()}</span>
      </div>
    </div>

    <!-- SHIPPING ADDRESS -->
    <div style="margin:0 32px 28px;">
      <h3 style="margin:0 0 10px;font-size:12px;letter-spacing:3px;color:#888;text-transform:uppercase;font-weight:600;">📍 Shipping Address</h3>
      <div style="background:#f9f9f9;border-left:3px solid #daa520;padding:14px 18px;border-radius:0 10px 10px 0;font-size:14px;color:#555;line-height:1.7;">${shippingAddress}</div>
    </div>

    <!-- TRACK ORDER BUTTON -->
    <div style="text-align:center;padding:0 32px 32px;">
      <a href="${appUrl}/orders/${orderNumber}"
         style="display:inline-block;background:linear-gradient(135deg,#daa520,#f0c040);color:#fff;padding:16px 48px;text-decoration:none;border-radius:50px;font-size:14px;font-weight:800;letter-spacing:2px;text-transform:uppercase;box-shadow:0 6px 20px rgba(218,165,32,0.4);">
        Track Your Order →
      </a>
    </div>

    <!-- MESSAGE -->
    <div style="margin:0 32px 28px;padding:20px 24px;background:#f9f6f0;border-radius:14px;border:1px solid #efe8d5;text-align:center;">
      <p style="margin:0;font-size:13px;color:#666;line-height:1.8;">
        We are currently processing your order and will notify you once it has been shipped.<br>
        You can expect delivery within the estimated time mentioned on our website.
      </p>
    </div>

    <!-- FOOTER -->
    <div style="background:#0f0f0f;padding:28px 32px;text-align:center;">
      <div style="font-size:22px;font-weight:900;color:#daa520;letter-spacing:4px;font-family:'Georgia',serif;margin-bottom:12px;">TECH4U</div>
      <p style="margin:0 0 6px;font-size:12px;color:#666;">Thank you for choosing Tech4U. We truly appreciate your trust in us!</p>
      <p style="margin:0 0 8px;font-size:11px;color:#555;">
        📧 Support: <a href="mailto:info@tech4ru.com" style="color:#daa520;text-decoration:none;">info@tech4ru.com</a>
        &nbsp;|&nbsp;
        🌐 <a href="https://tech4ru.com" style="color:#daa520;text-decoration:none;">tech4ru.com</a>
      </p>
      <p style="margin:0;font-size:10px;color:#444;">© ${new Date().getFullYear()} Tech4U — All Rights Reserved</p>
    </div>

  </div>
</body>
</html>`;
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
    } = body;

    console.log("========================================");
    console.log("🚀 NEW ORDER NOTIFICATION");
    console.log("📦 Order:", orderNumber);
    console.log("👤 Customer:", name);
    console.log("📧 Customer Email:", email);
    console.log("📱 Customer WhatsApp:", phone);
    console.log("💰 Total: PKR", total);
    console.log("========================================");

    if (!email || !phone || !name || !orderNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing: email, phone, name, or orderNumber",
        },
        { status: 400 }
      );
    }

    let emailSent = false;
    let whatsappSent = false;

    // ==========================================
    // STEP 1: EMAIL → CUSTOMER
    // ==========================================
    try {
      const customerHtml = buildCustomerEmailHtml(
        name,
        orderNumber,
        items,
        subtotal,
        shipping,
        total,
        shippingAddress,
        paymentMethod
      );

      await transporter.sendMail({
        from: `"Tech4U Orders" <${
          process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
        }>`,
        to: email,
        replyTo: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        subject: `Your Tech4U Order #${orderNumber} is Confirmed ✅`,
        html: customerHtml,
        headers: {
          "X-Mailer": "Tech4U-Mailer-1.0",
          "X-Priority": "1",
          "List-Unsubscribe": `<mailto:${
            process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
          }?subject=unsubscribe>`,
          "Message-ID": `<order-${orderNumber}-${Date.now()}@tech4u.com>`,
        },
      });

      console.log("✅ EMAIL SENT TO CUSTOMER:", email);
      emailSent = true;
    } catch (emailError: any) {
      console.error("❌ EMAIL FAILED:", emailError.message);
      emailSent = false;
    }

    // ==========================================
    // STEP 2: WHATSAPP → CUSTOMER
    // ==========================================
    try {
      const waMessage = buildWhatsAppMessage(
        name,
        orderNumber,
        total,
        items,
        shippingAddress,
        paymentMethod
      );
      whatsappSent = await sendWhatsAppViaGreenAPI(phone, waMessage);
    } catch (waError: any) {
      console.error("❌ WHATSAPP ERROR:", waError.message);
      whatsappSent = false;
    }

    // ==========================================
    // STEP 3: ADMIN ALERT → OWNER EMAIL
    // ==========================================
    try {
      const ownerEmail = process.env.OWNER_EMAIL || process.env.SMTP_USER;

      const itemsAdminHtml = items
        .map(
          (item: any) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;vertical-align:middle;">
            ${
              item.image
                ? `<img src="${item.image}" width="48" height="48" style="border-radius:8px;object-fit:cover;vertical-align:middle;margin-right:10px;" />`
                : "📦"
            }
            <strong>${item.name}</strong>${
            item.variant ? ` (${item.variant})` : ""
          }
          </td>
          <td style="text-align:center;padding:10px;border-bottom:1px solid #eee;font-size:13px;">×${
            item.quantity
          }</td>
          <td style="text-align:right;padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;font-weight:700;">PKR ${item.price.toLocaleString()}</td>
        </tr>
      `
        )
        .join("");

      await transporter.sendMail({
        from: `"Tech4U System" <${
          process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
        }>`,
        to: ownerEmail,
        subject: `🔔 NEW ORDER #${orderNumber} — PKR ${total.toLocaleString()} — ${name}`,
        headers: {
          "Message-ID": `<admin-${orderNumber}-${Date.now()}@tech4u.com>`,
        },
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:2px solid #daa520;">
            <div style="background:#1a1a1a;padding:24px;text-align:center;">
              <div style="font-size:28px;font-weight:900;color:#daa520;letter-spacing:4px;">TECH4U</div>
              <div style="font-size:11px;letter-spacing:3px;color:#666;margin-top:6px;">NEW ORDER RECEIVED</div>
            </div>
            <div style="padding:24px;">
              <h2 style="color:#daa520;margin:0 0 16px;font-size:20px;">🛍️ Order #${orderNumber}</h2>
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <tr><td style="padding:6px 0;font-size:13px;color:#666;">Customer</td><td style="font-size:13px;font-weight:700;color:#1a1a1a;">${name}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#666;">Email</td><td style="font-size:13px;color:#1a1a1a;">${email}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#666;">WhatsApp</td><td style="font-size:13px;color:#1a1a1a;">${phone}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#666;">Address</td><td style="font-size:13px;color:#1a1a1a;">${shippingAddress}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#666;">Payment</td><td style="font-size:13px;color:#1a1a1a;">${paymentMethod}</td></tr>
              </table>
              <h3 style="font-size:12px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-bottom:10px;">Items</h3>
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #eee;border-radius:8px;overflow:hidden;">
                ${itemsAdminHtml}
              </table>
              <div style="background:#faf8f0;border-radius:10px;padding:16px;border:1px solid #eedaa0;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;"><span style="color:#666;">Subtotal</span><span>PKR ${subtotal.toLocaleString()}</span></div>
                <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;"><span style="color:#666;">Shipping</span><span>${
                  shipping === 0 ? "FREE" : `PKR ${shipping.toLocaleString()}`
                }</span></div>
                <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:900;">
                  <span style="color:#1a1a1a;">TOTAL</span>
                  <span style="color:#daa520;">PKR ${total.toLocaleString()}</span>
                </div>
              </div>
              <p style="font-size:11px;color:#aaa;margin-top:16px;">
                Customer Email: ${
                  emailSent ? "✅ Sent to " + email : "❌ Failed"
                }<br>
                Customer WhatsApp: ${
                  whatsappSent
                    ? "✅ Sent to " + phone
                    : "⚠️ Failed — check Green API"
                }
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
