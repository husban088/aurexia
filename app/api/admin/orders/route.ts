// app/api/admin/orders/route.ts
// ✅ COMPLETE — GET all orders + PATCH status/shipping + Auto Notifications
// WhatsApp (WaSender) + Email (Resend) → Customer + Owner
// Statuses: confirmed | processing | shipped | delivered | cancelled

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// ─── Supabase Client ──────────────────────────────────────────────────────────
function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Resend Email Helper ──────────────────────────────────────────────────────
async function sendResendEmail(
  to: string | string[],
  subject: string,
  html: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY missing");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tech4U Orders <orders@tech4ru.com>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const result = await response.json();
    if (response.ok && result.id) {
      console.log(`✅ Email sent! ID: ${result.id}`);
      return true;
    } else {
      console.error("❌ Resend error:", JSON.stringify(result));
      return false;
    }
  } catch (err) {
    console.error("❌ Resend fetch error:", err);
    return false;
  }
}

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────

// ✅ CONFIRMED EMAIL — Customer ko
function confirmedEmailHTML(customerName: string, orderNumber: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:32px;text-align:center;">
    <h1 style="color:#daa520;margin:0;font-size:26px;letter-spacing:2px;">TECH4U</h1>
    <p style="color:#aaa;margin:6px 0 0;font-size:13px;">tech4ru.com</p>
  </div>

  <div style="background:#fffbeb;padding:28px 32px;text-align:center;border-bottom:2px solid rgba(218,165,32,0.3);">
    <div style="font-size:48px;margin-bottom:10px;">✅</div>
    <h2 style="color:#92400e;margin:0;font-size:22px;">Order Confirmed!</h2>
    <p style="color:#b45309;margin:8px 0 0;font-size:15px;">Hello <strong>${customerName}</strong>! Your order has been confirmed.</p>
  </div>

  <div style="padding:28px 32px;border-bottom:1px solid #f0f0f0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;width:45%;">Order Number</td>
        <td style="padding:8px 0;color:#1a1a1a;font-weight:700;font-size:15px;">${orderNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;">Status</td>
        <td style="padding:8px 0;color:#d97706;font-weight:700;font-size:14px;">✅ Confirmed</td>
      </tr>
    </table>
  </div>

  <div style="padding:28px 32px;text-align:center;">
    <p style="color:#555;font-size:15px;line-height:1.7;margin:0;">We've received your order and it's now confirmed. We'll notify you as soon as it starts processing. 🎉</p>
  </div>

  <div style="background:#1a1a1a;padding:24px 32px;text-align:center;">
    <p style="color:#daa520;margin:0 0 6px;font-size:14px;font-weight:600;">Questions? We're here!</p>
    <p style="color:#888;margin:0;font-size:13px;">📧 info@tech4ru.com &nbsp;|&nbsp; 🌐 tech4ru.com</p>
  </div>
</div>
</body>
</html>`;
}

// ✅ PROCESSING EMAIL — Customer ko
function processingEmailHTML(
  customerName: string,
  orderNumber: string,
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:32px;text-align:center;">
    <h1 style="color:#daa520;margin:0;font-size:26px;letter-spacing:2px;">TECH4U</h1>
    <p style="color:#aaa;margin:6px 0 0;font-size:13px;">tech4ru.com</p>
  </div>

  <div style="background:#f5f3ff;padding:28px 32px;text-align:center;border-bottom:2px solid rgba(139,92,246,0.2);">
    <div style="font-size:48px;margin-bottom:10px;">⚙️</div>
    <h2 style="color:#5b21b6;margin:0;font-size:22px;">Your Order is Being Processed!</h2>
    <p style="color:#6d28d9;margin:8px 0 0;font-size:15px;">Hello <strong>${customerName}</strong>! We're preparing your order now.</p>
  </div>

  <div style="padding:28px 32px;border-bottom:1px solid #f0f0f0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;width:45%;">Order Number</td>
        <td style="padding:8px 0;color:#1a1a1a;font-weight:700;font-size:15px;">${orderNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;">Status</td>
        <td style="padding:8px 0;color:#7c3aed;font-weight:700;font-size:14px;">⚙️ Processing</td>
      </tr>
    </table>
  </div>

  <div style="padding:28px 32px;text-align:center;">
    <p style="color:#555;font-size:15px;line-height:1.7;margin:0;">Our team is working on your order. You'll receive another update once it's shipped. 📦</p>
  </div>

  <div style="background:#1a1a1a;padding:24px 32px;text-align:center;">
    <p style="color:#daa520;margin:0 0 6px;font-size:14px;font-weight:600;">Questions? We're here!</p>
    <p style="color:#888;margin:0;font-size:13px;">📧 info@tech4ru.com &nbsp;|&nbsp; 🌐 tech4ru.com</p>
  </div>
</div>
</body>
</html>`;
}

// ✅ SHIPPED EMAIL — Customer ko
function shippedEmailHTML(
  customerName: string,
  orderNumber: string,
  courierName: string,
  courierCountry: string,
  trackingNumber: string,
  estimatedDays: string,
  courierTrackingUrl: string,
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:32px;text-align:center;">
    <h1 style="color:#daa520;margin:0;font-size:26px;letter-spacing:2px;">TECH4U</h1>
    <p style="color:#aaa;margin:6px 0 0;font-size:13px;">tech4ru.com</p>
  </div>

  <div style="background:#eff6ff;padding:28px 32px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.2);">
    <div style="font-size:48px;margin-bottom:10px;">🚚</div>
    <h2 style="color:#1e40af;margin:0;font-size:22px;">Your Order is On Its Way!</h2>
    <p style="color:#1d4ed8;margin:8px 0 0;font-size:15px;">Hello <strong>${customerName}</strong>! Your order has been shipped.</p>
  </div>

  <div style="padding:28px 32px;border-bottom:1px solid #f0f0f0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;width:45%;">Order Number</td>
        <td style="padding:8px 0;color:#1a1a1a;font-weight:700;font-size:15px;">${orderNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;">Courier</td>
        <td style="padding:8px 0;color:#1a1a1a;font-weight:600;font-size:14px;">🏢 ${courierName}${courierCountry ? ` (${courierCountry})` : ""}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;">Tracking Number</td>
        <td style="padding:8px 0;color:#1a1a1a;font-weight:700;font-family:monospace;font-size:15px;">📦 ${trackingNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;">Estimated Delivery</td>
        <td style="padding:8px 0;color:#d97706;font-weight:600;font-size:14px;">⏱ ${estimatedDays}</td>
      </tr>
    </table>
  </div>

  ${
    courierTrackingUrl
      ? `<div style="padding:24px 32px;text-align:center;border-bottom:1px solid #f0f0f0;">
    <a href="${courierTrackingUrl}"
       style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#1e40af);color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.5px;">
      🔗 Track My Order →
    </a>
    <p style="color:#888;font-size:12px;margin:10px 0 0;">Click above to track your parcel on ${courierName}'s website</p>
  </div>`
      : ""
  }

  <div style="background:#1a1a1a;padding:24px 32px;text-align:center;">
    <p style="color:#daa520;margin:0 0 6px;font-size:14px;font-weight:600;">Questions? We're here!</p>
    <p style="color:#888;margin:0;font-size:13px;">📧 info@tech4ru.com &nbsp;|&nbsp; 🌐 tech4ru.com</p>
  </div>
</div>
</body>
</html>`;
}

// ✅ DELIVERED EMAIL — Customer ko
function deliveredEmailHTML(customerName: string, orderNumber: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:32px;text-align:center;">
    <h1 style="color:#daa520;margin:0;font-size:26px;letter-spacing:2px;">TECH4U</h1>
    <p style="color:#aaa;margin:6px 0 0;font-size:13px;">tech4ru.com</p>
  </div>

  <div style="background:#f0fdf4;padding:32px;text-align:center;border-bottom:2px solid rgba(34,197,94,0.2);">
    <div style="font-size:52px;margin-bottom:10px;">🎉</div>
    <h2 style="color:#166534;margin:0;font-size:22px;">Order Delivered Successfully!</h2>
    <p style="color:#15803d;margin:10px 0 0;font-size:15px;">Hello <strong>${customerName}</strong>! Your order <strong>${orderNumber}</strong> has been delivered.</p>
  </div>

  <div style="padding:32px;text-align:center;">
    <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">We hope you love your purchase! 🛍️<br>Please leave us a review — it helps us a lot.</p>
    <a href="https://tech4ru.com"
       style="display:inline-block;background:linear-gradient(135deg,#daa520,#b8860b);color:#1a1a1a;padding:13px 30px;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px;">
      Shop More at Tech4U →
    </a>
  </div>

  <div style="background:#1a1a1a;padding:24px 32px;text-align:center;">
    <p style="color:#daa520;margin:0 0 6px;font-size:14px;font-weight:600;">Thank you for choosing Tech4U! ✨</p>
    <p style="color:#888;margin:0;font-size:13px;">📧 info@tech4ru.com &nbsp;|&nbsp; 🌐 tech4ru.com</p>
  </div>
</div>
</body>
</html>`;
}

// ✅ CANCELLED EMAIL — Customer ko
function cancelledEmailHTML(customerName: string, orderNumber: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:32px;text-align:center;">
    <h1 style="color:#daa520;margin:0;font-size:26px;letter-spacing:2px;">TECH4U</h1>
    <p style="color:#aaa;margin:6px 0 0;font-size:13px;">tech4ru.com</p>
  </div>

  <div style="background:#fef2f2;padding:32px;text-align:center;border-bottom:2px solid rgba(239,68,68,0.2);">
    <div style="font-size:48px;margin-bottom:10px;">❌</div>
    <h2 style="color:#991b1b;margin:0;font-size:22px;">Order Cancelled</h2>
    <p style="color:#b91c1c;margin:10px 0 0;font-size:15px;">Hello <strong>${customerName}</strong>, your order <strong>${orderNumber}</strong> has been cancelled.</p>
  </div>

  <div style="padding:32px;text-align:center;">
    <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 8px;">If you have any questions or need help, please contact us.</p>
    <p style="color:#555;font-size:14px;margin:0 0 24px;">If this was a mistake or you'd like to re-order, we're happy to help!</p>
    <a href="mailto:info@tech4ru.com"
       style="display:inline-block;background:#1a1a1a;color:#daa520;padding:13px 30px;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px;">
      Contact Us →
    </a>
  </div>

  <div style="background:#1a1a1a;padding:24px 32px;text-align:center;">
    <p style="color:#888;margin:0;font-size:13px;">📧 info@tech4ru.com &nbsp;|&nbsp; 🌐 tech4ru.com</p>
  </div>
</div>
</body>
</html>`;
}

// ✅ OWNER ALERT EMAIL — Owner ke saare emails ko (all statuses)
function ownerAlertEmailHTML(
  status: string,
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  extraInfo?: string,
): string {
  const statusEmoji =
    status === "shipped"
      ? "🚚"
      : status === "delivered"
        ? "✅"
        : status === "cancelled"
          ? "❌"
          : status === "confirmed"
            ? "✅"
            : "⚙️";

  const statusColor =
    status === "shipped"
      ? "#1d4ed8"
      : status === "delivered"
        ? "#15803d"
        : status === "cancelled"
          ? "#991b1b"
          : status === "confirmed"
            ? "#92400e"
            : "#5b21b6";

  const statusBg =
    status === "shipped"
      ? "#eff6ff"
      : status === "delivered"
        ? "#f0fdf4"
        : status === "cancelled"
          ? "#fef2f2"
          : status === "confirmed"
            ? "#fffbeb"
            : "#f5f3ff";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:${statusBg};padding:24px 32px;border-bottom:2px solid ${statusColor}30;">
    <h2 style="color:${statusColor};margin:0;font-size:20px;">${statusEmoji} Order ${status.toUpperCase()} — Admin Alert</h2>
    <p style="color:#666;margin:6px 0 0;font-size:13px;">Tech4U Admin — ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} PKT</p>
  </div>

  <div style="padding:28px 32px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;width:40%;">Order Number</td>
        <td style="padding:8px 0;color:#1a1a1a;font-weight:700;">${orderNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;">Customer</td>
        <td style="padding:8px 0;color:#1a1a1a;font-weight:600;">${customerName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;">Email</td>
        <td style="padding:8px 0;"><a href="mailto:${customerEmail}" style="color:#2563eb;">${customerEmail}</a></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;">Phone</td>
        <td style="padding:8px 0;"><a href="https://wa.me/${customerPhone.replace(/\D/g, "")}" style="color:#16a34a;font-weight:600;">📱 ${customerPhone}</a></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;">New Status</td>
        <td style="padding:8px 0;color:${statusColor};font-weight:700;font-size:15px;">${statusEmoji} ${status.toUpperCase()}</td>
      </tr>
      ${
        extraInfo
          ? `<tr>
        <td style="padding:8px 0;color:#888;font-size:14px;">Shipping Info</td>
        <td style="padding:8px 0;color:#1a1a1a;font-size:13px;">${extraInfo}</td>
      </tr>`
          : ""
      }
    </table>
  </div>

  <div style="background:#1a1a1a;padding:20px 32px;text-align:center;">
    <p style="color:#888;margin:0;font-size:12px;">Tech4U Admin Panel — tech4ru.com</p>
  </div>
</div>
</body>
</html>`;
}

// ─── WHATSAPP MESSAGES ────────────────────────────────────────────────────────

function confirmedWhatsAppMsg(name: string, orderNumber: string): string {
  return `✅ *Order Confirmed — Tech4U*

Hello *${name}*! 🎉

Your order *${orderNumber}* has been confirmed!

We'll notify you as soon as we start processing it.

For any questions:
📧 info@tech4ru.com
🌐 tech4ru.com

Thank you for choosing Tech4U! ✨`;
}

function processingWhatsAppMsg(name: string, orderNumber: string): string {
  return `⚙️ *Order Processing — Tech4U*

Hello *${name}*!

Your order *${orderNumber}* is now being processed. Our team is preparing it for shipment.

We'll send you tracking details once it's shipped! 📦

For any questions:
📧 info@tech4ru.com
🌐 tech4ru.com

Thank you for your patience! 🙏`;
}

function shippedWhatsAppMsg(
  name: string,
  orderNumber: string,
  courierName: string,
  trackingNumber: string,
  estimatedDays: string,
  trackingUrl: string,
): string {
  return `🚚 *Your Order is Shipped — Tech4U*

Hello *${name}*! Great news! 🎉

━━━━━━━━━━━━━━━━━
📦 *Order:* ${orderNumber}
🏢 *Courier:* ${courierName}
📦 *Tracking No:* ${trackingNumber}
⏱ *Estimated Delivery:* ${estimatedDays}
━━━━━━━━━━━━━━━━━

${trackingUrl ? `🔗 *Track your parcel:*\n${trackingUrl}` : ""}

Your order is on its way! We'll update you when it's delivered.

For any questions:
📧 info@tech4ru.com
🌐 tech4ru.com

Thank you for choosing Tech4U! ✨`;
}

function deliveredWhatsAppMsg(name: string, orderNumber: string): string {
  return `✅ *Order Delivered — Tech4U* 🎉

Hello *${name}*!

Your order *${orderNumber}* has been successfully delivered! 📦

We hope you love your purchase! 🛍️

If you need anything:
📧 info@tech4ru.com
🌐 tech4ru.com

Thank you for shopping with Tech4U! ⭐`;
}

function cancelledWhatsAppMsg(name: string, orderNumber: string): string {
  return `❌ *Order Cancelled — Tech4U*

Hello *${name}*,

Your order *${orderNumber}* has been cancelled.

If you have any questions or need help:
📧 info@tech4ru.com
🌐 tech4ru.com

We hope to serve you again soon. 🙏`;
}

// ─── NOTIFICATION DISPATCHER ──────────────────────────────────────────────────
// Reusable function — sends WhatsApp + Customer Email + Owner Email in parallel

async function dispatchNotifications({
  status,
  customerEmail,
  customerPhone,
  customerName,
  orderNumber,
  courierName,
  courierCountry,
  estimatedDays,
  trackingNumber,
  courierTrackingUrl,
}: {
  status: string;
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
  orderNumber: string;
  courierName?: string;
  courierCountry?: string;
  estimatedDays?: string;
  trackingNumber?: string;
  courierTrackingUrl?: string;
}): Promise<{
  whatsappSent: boolean;
  customerEmailSent: boolean;
  ownerEmailSent: boolean;
}> {
  // Owner emails list from env
  const ownerEmails = (
    process.env.OWNER_EMAILS ||
    process.env.OWNER_EMAIL ||
    "tech4ruu@gmail.com"
  )
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  let whatsappMsg = "";
  let customerEmailSubject = "";
  let customerEmailHtml = "";
  let ownerEmailSubject = "";
  let ownerEmailHtml = "";

  if (status === "confirmed") {
    whatsappMsg = confirmedWhatsAppMsg(customerName, orderNumber);
    customerEmailSubject = `✅ Order ${orderNumber} Confirmed — Tech4U`;
    customerEmailHtml = confirmedEmailHTML(customerName, orderNumber);
    ownerEmailSubject = `✅ Order ${orderNumber} Confirmed`;
    ownerEmailHtml = ownerAlertEmailHTML(
      status,
      orderNumber,
      customerName,
      customerEmail,
      customerPhone || "",
    );
  } else if (status === "processing") {
    whatsappMsg = processingWhatsAppMsg(customerName, orderNumber);
    customerEmailSubject = `⚙️ Order ${orderNumber} is Being Processed — Tech4U`;
    customerEmailHtml = processingEmailHTML(customerName, orderNumber);
    ownerEmailSubject = `⚙️ Order ${orderNumber} Processing`;
    ownerEmailHtml = ownerAlertEmailHTML(
      status,
      orderNumber,
      customerName,
      customerEmail,
      customerPhone || "",
    );
  } else if (status === "shipped") {
    const cn = courierName || "Courier";
    const tn = trackingNumber || "N/A";
    const ed = estimatedDays || "3–5 business days";
    const tu = courierTrackingUrl || "";

    whatsappMsg = shippedWhatsAppMsg(customerName, orderNumber, cn, tn, ed, tu);
    customerEmailSubject = `🚚 Your Order ${orderNumber} Has Been Shipped — Tech4U`;
    customerEmailHtml = shippedEmailHTML(
      customerName,
      orderNumber,
      cn,
      courierCountry || "",
      tn,
      ed,
      tu,
    );
    ownerEmailSubject = `🚚 Order ${orderNumber} Marked as Shipped`;
    ownerEmailHtml = ownerAlertEmailHTML(
      status,
      orderNumber,
      customerName,
      customerEmail,
      customerPhone || "",
      `${cn} | Tracking: ${tn} | Est: ${ed}`,
    );
  } else if (status === "delivered") {
    whatsappMsg = deliveredWhatsAppMsg(customerName, orderNumber);
    customerEmailSubject = `✅ Your Order ${orderNumber} Has Been Delivered — Tech4U`;
    customerEmailHtml = deliveredEmailHTML(customerName, orderNumber);
    ownerEmailSubject = `✅ Order ${orderNumber} Delivered`;
    ownerEmailHtml = ownerAlertEmailHTML(
      status,
      orderNumber,
      customerName,
      customerEmail,
      customerPhone || "",
    );
  } else if (status === "cancelled") {
    whatsappMsg = cancelledWhatsAppMsg(customerName, orderNumber);
    customerEmailSubject = `❌ Your Order ${orderNumber} Has Been Cancelled — Tech4U`;
    customerEmailHtml = cancelledEmailHTML(customerName, orderNumber);
    ownerEmailSubject = `❌ Order ${orderNumber} Cancelled`;
    ownerEmailHtml = ownerAlertEmailHTML(
      status,
      orderNumber,
      customerName,
      customerEmail,
      customerPhone || "",
    );
  }

  const [whatsappResult, customerEmailResult, ownerEmailResult] =
    await Promise.allSettled([
      // WhatsApp → Customer (only if phone exists)
      customerPhone && whatsappMsg
        ? sendWhatsAppMessage(customerPhone, whatsappMsg)
        : Promise.resolve(false),

      // Email → Customer
      customerEmailHtml
        ? sendResendEmail(
            customerEmail,
            customerEmailSubject,
            customerEmailHtml,
          )
        : Promise.resolve(false),

      // Email → Owner (all owner emails)
      ownerEmailHtml
        ? sendResendEmail(ownerEmails, ownerEmailSubject, ownerEmailHtml)
        : Promise.resolve(false),
    ]);

  const whatsappSent =
    whatsappResult.status === "fulfilled" && whatsappResult.value === true;
  const customerEmailSent =
    customerEmailResult.status === "fulfilled" &&
    customerEmailResult.value === true;
  const ownerEmailSent =
    ownerEmailResult.status === "fulfilled" && ownerEmailResult.value === true;

  console.log(`📊 Notifications for ${orderNumber} (${status}):`, {
    whatsapp: whatsappSent ? "✅" : "❌",
    customerEmail: customerEmailSent ? "✅" : "❌",
    ownerEmail: ownerEmailSent ? "✅" : "❌",
  });

  return { whatsappSent, customerEmailSent, ownerEmailSent };
}

// ─── GET /api/admin/orders ────────────────────────────────────────────────────
export async function GET(_req: NextRequest) {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API/orders] Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ orders: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH /api/admin/orders ──────────────────────────────────────────────────
// Updates order status + shipping details, then fires notifications automatically
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      status,
      courier_name,
      courier_country,
      estimated_days,
      tracking_number,
      courier_tracking_url,
      shipped_at,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 },
      );
    }

    // ── Build DB update payload ──
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) updatePayload.status = status;
    if (courier_name !== undefined) updatePayload.courier_name = courier_name;
    if (courier_country !== undefined)
      updatePayload.courier_country = courier_country;
    if (estimated_days !== undefined)
      updatePayload.estimated_days = estimated_days;
    if (tracking_number !== undefined)
      updatePayload.tracking_number = tracking_number;
    if (courier_tracking_url !== undefined)
      updatePayload.courier_tracking_url = courier_tracking_url;
    if (shipped_at !== undefined) {
      updatePayload.shipped_at =
        shipped_at === "now" ? new Date().toISOString() : shipped_at;
    }
    // Auto-set shipped_at when status changes to shipped and not explicitly provided
    if (status === "shipped" && shipped_at === undefined) {
      updatePayload.shipped_at = new Date().toISOString();
    }

    if (Object.keys(updatePayload).length === 1) {
      return NextResponse.json(
        { error: "At least one field to update is required" },
        { status: 400 },
      );
    }

    const supabase = getClient();

    // ── Get order details BEFORE update (for notifications) ──
    const { data: orderData, error: fetchError } = await supabase
      .from("orders")
      .select(
        "email, first_name, last_name, phone, order_number, status, tracking_number, courier_name, courier_country, courier_tracking_url, estimated_days",
      )
      .eq("id", orderId)
      .single();

    if (fetchError) {
      console.warn(
        "[API/orders PATCH] Could not fetch order details:",
        fetchError.message,
      );
    }

    // ── Update the order in DB ──
    const { error: dbError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (dbError) {
      console.error("[API/orders PATCH] DB Error:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    console.log(
      `✅ DB updated: Order ${orderData?.order_number ?? orderId} → ${status}`,
    );

    // ── Send notifications if status changed to a notifiable status ──
    const notifiableStatuses = [
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    let whatsappSent = false;
    let customerEmailSent = false;
    let ownerEmailSent = false;

    if (status && notifiableStatuses.includes(status) && orderData?.email) {
      const customerName =
        `${orderData.first_name || ""} ${orderData.last_name || ""}`.trim() ||
        "Customer";

      // Use newly provided values, fallback to existing DB values
      const finalCourierName = courier_name ?? orderData.courier_name;
      const finalCourierCountry = courier_country ?? orderData.courier_country;
      const finalTrackingNumber = tracking_number ?? orderData.tracking_number;
      const finalCourierUrl =
        courier_tracking_url ?? orderData.courier_tracking_url;
      const finalEstimatedDays = estimated_days ?? orderData.estimated_days;

      // Fire notifications (awaited so we can return results)
      ({ whatsappSent, customerEmailSent, ownerEmailSent } =
        await dispatchNotifications({
          status,
          customerEmail: orderData.email,
          customerPhone: orderData.phone || "",
          customerName,
          orderNumber: orderData.order_number,
          courierName: finalCourierName,
          courierCountry: finalCourierCountry,
          estimatedDays: finalEstimatedDays,
          trackingNumber: finalTrackingNumber,
          courierTrackingUrl: finalCourierUrl,
        }));
    } else if (status && !notifiableStatuses.includes(status)) {
      console.log(
        `ℹ️ Status "${status}" is not in notifiable list — no notifications sent.`,
      );
    } else if (!orderData?.email) {
      console.warn(
        `⚠️ No customer email found for order ${orderId} — notifications skipped.`,
      );
    }

    return NextResponse.json({
      success: true,
      status,
      whatsappSent,
      emailSent: customerEmailSent,
      ownerEmailSent,
    });
  } catch (err: any) {
    console.error("[API/orders PATCH] Exception:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
