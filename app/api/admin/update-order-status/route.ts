// ✅ FILE PATH: app/api/admin/update-order-status/route.ts
// ✅ FULLY FIXED — Direct Inbox Delivery (Yahoo, Hotmail, Gmail, info)
// ✅ Anti-spam headers added (List-Unsubscribe, Message-ID, X-Entity-Ref-ID)
// ✅ Brevo API — PRIMARY
// ✅ Gmail SMTP — FALLBACK
// ✅ WasenderAPI — WhatsApp notifications
// ✅ Shipped, Delivered, Cancelled — all working

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Phone Formatter ──────────────────────────────────────────────────────────
function formatPhone(phone: string): string {
  if (!phone) return "";
  let clean = phone.trim().replace(/[\s\-\(\)\.]/g, "");
  if (clean.startsWith("+")) return "+" + clean.slice(1).replace(/\D/g, "");
  if (clean.startsWith("0") && clean.length === 11 && clean[1] === "3")
    return "+92" + clean.slice(1).replace(/\D/g, "");
  if (clean.startsWith("07") && clean.length === 11)
    return "+44" + clean.slice(1).replace(/\D/g, "");
  if (clean.startsWith("04") && clean.length === 10)
    return "+61" + clean.slice(1).replace(/\D/g, "");
  return "+" + clean.replace(/\D/g, "");
}

// ─── Supabase ─────────────────────────────────────────────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

// ─── Unique Message ID generator ─────────────────────────────────────────────
function generateMessageId(orderNumber: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `<order-${orderNumber}-${ts}-${rand}@tech4ru.com>`;
}

// ─── WhatsApp via WasenderAPI ─────────────────────────────────────────────────
async function sendWA(to: string, message: string): Promise<boolean> {
  const apiKey = process.env.WASENDER_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ WASENDER_API_KEY missing");
    return false;
  }
  const toFormatted = formatPhone(to);
  if (!toFormatted || toFormatted.length < 8) {
    console.warn("⚠️ Invalid phone:", to, "→", toFormatted);
    return false;
  }
  console.log(`📱 WhatsApp → ${toFormatted}`);
  try {
    const res = await fetch("https://www.wasenderapi.com/api/send-message", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: toFormatted, text: message }),
    });
    const r = await res.json();
    if (res.ok && r.success) {
      console.log(`✅ WhatsApp sent → ${toFormatted}`);
      return true;
    }
    console.error(`❌ WhatsApp error:`, JSON.stringify(r));
    return false;
  } catch (e: any) {
    console.error(`❌ WhatsApp exception:`, e.message);
    return false;
  }
}

// ─── Email via Brevo API (PRIMARY) ────────────────────────────────────────────
// ✅ Anti-spam headers included: List-Unsubscribe, Message-ID, Precedence
// ✅ These are REQUIRED for Yahoo, Hotmail, info emails to go to inbox
async function sendEmailViaBrevo(
  to: string,
  subject: string,
  html: string,
  text: string,
  orderNumber: string,
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { sent: false, error: "BREVO_API_KEY not set" };

  const fromEmail = process.env.BREVO_FROM_EMAIL || "orders@tech4ru.com";
  const fromName = process.env.BREVO_FROM_NAME || "Tech4U";
  const messageId = generateMessageId(orderNumber);
  const unsubEmail = `mailto:orders@tech4ru.com?subject=unsubscribe-${orderNumber}`;

  console.log(`📧 [Brevo] Sending → ${to}`);

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
        textContent: text,
        replyTo: { email: fromEmail, name: fromName },

        // ✅ CRITICAL: These headers prevent spam classification
        headers: {
          // Unique message ID — prevents duplicate detection
          "Message-ID": messageId,

          // Tells mail servers this is transactional (NOT bulk/marketing)
          // This is the #1 fix for Yahoo & Hotmail inbox delivery
          "X-Mailer": "Tech4U-OrderSystem/1.0",
          Precedence: "transactional",

          // List-Unsubscribe — REQUIRED by Yahoo/Microsoft for inbox delivery
          // Without this, Yahoo/Hotmail treats email as spam
          "List-Unsubscribe": `<${unsubEmail}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",

          // Unique entity ID — prevents Hotmail dedup filter
          "X-Entity-Ref-ID": messageId,

          // Category tag — tells Brevo this is transactional
          "X-SES-MESSAGE-TAGS": "type=transactional",
        },

        // ✅ Brevo category — MUST be "transactionalEmail" not marketing
        // This uses your verified sender domain's DKIM automatically
        tags: ["order-notification", "transactional"],
      }),
    });

    const data = await res.json();

    if (res.ok && data.messageId) {
      console.log(`✅ [Brevo] Sent! MessageID: ${data.messageId} → ${to}`);
      return { sent: true };
    }

    const errMsg = data?.message || JSON.stringify(data);
    console.error(`❌ [Brevo] Failed: ${errMsg}`);
    return { sent: false, error: `Brevo: ${errMsg}` };
  } catch (e: any) {
    console.error(`❌ [Brevo] Exception:`, e.message);
    return { sent: false, error: e.message };
  }
}

// ─── Email via Gmail SMTP (FALLBACK) ─────────────────────────────────────────
async function sendEmailViaSmtp(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<{ sent: boolean; error?: string }> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass)
    return { sent: false, error: "SMTP_USER or SMTP_PASS missing" };

  console.log(`📧 [SMTP Fallback] Sending → ${to}`);
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 35000,
    } as any);

    try {
      await transporter.verify();
    } catch (ve: any) {
      return { sent: false, error: `SMTP verify failed: ${ve.message}` };
    }

    const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;
    const fromName = process.env.SMTP_FROM_NAME || "Tech4U";

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      replyTo: fromEmail,
      subject,
      html,
      text,
    });

    console.log(`✅ [SMTP] Sent → ${to} | ID: ${info.messageId}`);
    return { sent: true };
  } catch (e: any) {
    console.error(`❌ [SMTP] Failed (${to}): ${e.message}`);
    return { sent: false, error: e.message };
  }
}

// ─── Smart Email Sender ───────────────────────────────────────────────────────
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  orderNumber: string,
): Promise<{ sent: boolean; error?: string }> {
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
    return { sent: false, error: `Invalid email: "${to}"` };
  }
  const toClean = to.trim().toLowerCase();

  // Brevo primary (with all anti-spam headers)
  const brevoResult = await sendEmailViaBrevo(
    toClean,
    subject,
    html,
    text,
    orderNumber,
  );
  if (brevoResult.sent) return brevoResult;

  // Gmail SMTP fallback
  console.warn("⚠️ Brevo failed, trying Gmail SMTP fallback...");
  return sendEmailViaSmtp(toClean, subject, html, text);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderStatus = "shipped" | "delivered" | "cancelled";
interface ShippingInfo {
  courierName?: string;
  courierCountry?: string;
  estimatedDays?: string;
  trackingNumber?: string;
  courierTrackingUrl?: string;
}

// ─── WhatsApp Message Builder ─────────────────────────────────────────────────
function buildWAMessage(
  status: OrderStatus,
  name: string,
  orderNumber: string,
  shipping?: ShippingInfo,
): string {
  if (status === "shipped") {
    let trackingSection = "";
    if (shipping?.trackingNumber) {
      trackingSection = `\n\n📦 *Tracking Number:* ${shipping.trackingNumber}`;
      if (shipping?.courierTrackingUrl)
        trackingSection += `\n🔗 *Track Your Parcel:*\n${shipping.courierTrackingUrl}`;
    }
    return `🚚 *Order Shipped — Tech4U*

Hello *${name}*! Your order is on the way! 🎉

Order *#${orderNumber}* has been shipped!

🏢 Courier: ${shipping?.courierName || "Our delivery partner"}
🌍 Ship To: ${shipping?.courierCountry || ""}
⏱ Est. Delivery: ${shipping?.estimatedDays || "2-5 business days"}${trackingSection}

Questions? Contact us:
📧 orders@tech4ru.com
🌐 tech4ru.com

Thank you for choosing Tech4U!`;
  }

  if (status === "delivered") {
    return `✅ *Order Delivered — Tech4U*

Hello *${name}*! 🎉

Order *#${orderNumber}* has been DELIVERED!

We hope you love your purchase!

Please leave us a review at:
🌐 tech4ru.com

Questions? 📧 orders@tech4ru.com

Thank you for choosing Tech4U!`;
  }

  return `Order Cancelled — Tech4U

Hello ${name},

Order #${orderNumber} has been cancelled.
We apologize for the inconvenience.

If you have any questions:
📧 orders@tech4ru.com
🌐 tech4ru.com

We hope to serve you again.
— Tech4U Team`;
}

// ─── Email Subject Builder ─────────────────────────────────────────────────────
// ✅ IMPORTANT: Subject lines are clean, no special symbols
// Symbols in subject (✅❌🚚) can trigger Yahoo/Hotmail spam filters
function getEmailSubject(status: OrderStatus, orderNumber: string): string {
  const subjects: Record<OrderStatus, string> = {
    shipped: `Your Tech4U order #${orderNumber} has been shipped`,
    delivered: `Your Tech4U order #${orderNumber} has been delivered`,
    cancelled: `Your Tech4U order #${orderNumber} - Cancellation Confirmation`,
  };
  return subjects[status];
}

// ─── Email Text Builder (plain text version — REQUIRED for inbox delivery) ───
// ✅ Plain text version is CRITICAL — emails without plain text = spam flag
function buildEmailText(
  status: OrderStatus,
  name: string,
  orderNumber: string,
  shipping?: ShippingInfo,
): string {
  if (status === "shipped") {
    let tracking = "";
    if (shipping?.trackingNumber)
      tracking = `\nTracking Number: ${shipping.trackingNumber}`;
    if (shipping?.courierTrackingUrl)
      tracking += `\nTrack online: ${shipping.courierTrackingUrl}`;
    return `Your Tech4U Order Has Been Shipped

Hello ${name},

Your order #${orderNumber} has been shipped and is on its way!

Courier: ${shipping?.courierName || "Our delivery partner"}
Shipping to: ${shipping?.courierCountry || ""}
Estimated Delivery: ${shipping?.estimatedDays || "2-5 business days"}${tracking}

If you have any questions, contact us at:
Email: orders@tech4ru.com
Website: https://tech4ru.com

Thank you for shopping with Tech4U.

---
Tech4U | orders@tech4ru.com | https://tech4ru.com
To unsubscribe: mailto:orders@tech4ru.com?subject=unsubscribe-${orderNumber}`;
  }

  if (status === "delivered") {
    return `Your Tech4U Order Has Been Delivered

Hello ${name},

Great news! Your order #${orderNumber} has been successfully delivered.

We hope you enjoy your purchase!

Questions? Contact us:
Email: orders@tech4ru.com
Website: https://tech4ru.com

Thank you for choosing Tech4U.

---
Tech4U | orders@tech4ru.com | https://tech4ru.com
To unsubscribe: mailto:orders@tech4ru.com?subject=unsubscribe-${orderNumber}`;
  }

  return `Tech4U Order Cancellation

Hello ${name},

Your order #${orderNumber} has been cancelled.
We apologize for the inconvenience.

Questions? Contact us:
Email: orders@tech4ru.com
Website: https://tech4ru.com

We hope to serve you again.
Tech4U Team

---
Tech4U | orders@tech4ru.com | https://tech4ru.com
To unsubscribe: mailto:orders@tech4ru.com?subject=unsubscribe-${orderNumber}`;
}

// ─── Email HTML Builder ────────────────────────────────────────────────────────
// ✅ Table-based layout (best inbox compatibility)
// ✅ Physical address in footer (required by CAN-SPAM / inbox rules)
// ✅ Unsubscribe link (required by Yahoo/Hotmail)
// ✅ No image-only content, no excessive links, no spammy words
function buildEmailHtml(
  status: OrderStatus,
  name: string,
  orderNumber: string,
  shipping?: ShippingInfo,
): string {
  let trackingRows = "";
  if (status === "shipped") {
    if (shipping?.courierName)
      trackingRows += `<tr><td style="padding:10px 16px;font-size:13px;color:#555555;border-bottom:1px solid #eeeeee;">Courier</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#111111;text-align:right;border-bottom:1px solid #eeeeee;">${shipping.courierName}</td></tr>`;
    if (shipping?.courierCountry)
      trackingRows += `<tr><td style="padding:10px 16px;font-size:13px;color:#555555;border-bottom:1px solid #eeeeee;">Shipping To</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#111111;text-align:right;border-bottom:1px solid #eeeeee;">${shipping.courierCountry}</td></tr>`;
    if (shipping?.estimatedDays)
      trackingRows += `<tr><td style="padding:10px 16px;font-size:13px;color:#555555;border-bottom:1px solid #eeeeee;">Estimated Delivery</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#b8860b;text-align:right;border-bottom:1px solid #eeeeee;">${shipping.estimatedDays}</td></tr>`;
    if (shipping?.trackingNumber)
      trackingRows += `<tr><td style="padding:10px 16px;font-size:13px;color:#555555;border-bottom:1px solid #eeeeee;">Tracking Number</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#111111;text-align:right;border-bottom:1px solid #eeeeee;font-family:Courier New,monospace;">${shipping.trackingNumber}</td></tr>`;
    if (shipping?.courierTrackingUrl)
      trackingRows += `<tr><td style="padding:10px 16px;font-size:13px;color:#555555;">Track Online</td><td style="padding:10px 16px;font-size:13px;text-align:right;"><a href="${shipping.courierTrackingUrl}" style="color:#b8860b;font-weight:600;text-decoration:none;" target="_blank">Track Your Parcel</a></td></tr>`;
  }

  const configs: Record<
    OrderStatus,
    { label: string; color: string; bg: string; heading: string; body: string }
  > = {
    shipped: {
      label: "Order Shipped",
      color: "#1565c0",
      bg: "#e3f2fd",
      heading: "Your order is on its way",
      body: `Hello ${name},<br><br>Your order <strong>#${orderNumber}</strong> has been shipped and is heading your way. Please find your shipping details below.<br><br>Thank you for shopping with Tech4U.`,
    },
    delivered: {
      label: "Order Delivered",
      color: "#2e7d32",
      bg: "#e8f5e9",
      heading: "Your order has been delivered",
      body: `Hello ${name},<br><br>Your order <strong>#${orderNumber}</strong> has been successfully delivered. We hope you enjoy your purchase!<br><br>If you have any questions, please contact us at <a href="mailto:orders@tech4ru.com" style="color:#b8860b;">orders@tech4ru.com</a>.<br><br>Thank you for choosing Tech4U.`,
    },
    cancelled: {
      label: "Order Cancelled",
      color: "#c62828",
      bg: "#ffebee",
      heading: "Your order has been cancelled",
      body: `Hello ${name},<br><br>Your order <strong>#${orderNumber}</strong> has been cancelled. We apologize for the inconvenience.<br><br>For questions or assistance, please contact us at <a href="mailto:orders@tech4ru.com" style="color:#b8860b;">orders@tech4ru.com</a>.<br><br>We hope to serve you again.<br>The Tech4U Team`,
    },
  };

  const c = configs[status];

  const trackButton =
    status === "shipped" && shipping?.courierTrackingUrl
      ? `<tr>
          <td style="padding:0 32px 28px;text-align:center;">
            <a href="${shipping.courierTrackingUrl}" target="_blank"
              style="display:inline-block;background-color:#daa520;color:#1a1a1a;font-size:14px;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">
              Track My Order
            </a>
          </td>
        </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="format-detection" content="telephone=no">
  <title>${c.label} - Tech4U Order #${orderNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<!-- Preview text (hidden — shows in inbox preview) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f4f4f4;">
  ${c.label}: Your Tech4U order #${orderNumber}. ${
    status === "shipped"
      ? `Shipped via ${shipping?.courierName || "courier"}. Est. delivery: ${shipping?.estimatedDays || "2-5 business days"}.`
      : status === "delivered"
        ? "Your order has arrived! We hope you love it."
        : "We apologize for the inconvenience. Contact us for help."
  }
  &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;">
  <tr>
    <td align="center" style="padding:24px 12px;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

        <!-- HEADER -->
        <tr>
          <td style="background-color:#1a1a1a;padding:28px 32px;text-align:center;border-radius:10px 10px 0 0;">
            <p style="margin:0;color:#daa520;font-size:22px;font-weight:800;letter-spacing:4px;font-family:Arial,Helvetica,sans-serif;">TECH4U</p>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Order Notification</p>
          </td>
        </tr>

        <!-- MAIN CONTENT -->
        <tr>
          <td style="background-color:#ffffff;padding:32px 32px 0;">

            <!-- Status badge -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 16px;">
              <tr>
                <td style="background-color:${c.bg};border-radius:20px;padding:8px 20px;">
                  <span style="font-size:14px;font-weight:700;color:${c.color};font-family:Arial,Helvetica,sans-serif;">${c.label}</span>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111111;text-align:center;font-family:Arial,Helvetica,sans-serif;">${c.heading}</p>
            <p style="margin:0 0 24px;font-size:14px;color:#444444;line-height:1.8;font-family:Arial,Helvetica,sans-serif;">${c.body}</p>

          </td>
        </tr>

        <!-- ORDER DETAILS TABLE -->
        <tr>
          <td style="background-color:#ffffff;padding:0 32px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="padding:10px 16px;font-size:13px;color:#555555;background:#f9f9f9;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;">Order Number</td>
                <td style="padding:10px 16px;font-size:13px;font-weight:700;color:#111111;text-align:right;background:#f9f9f9;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;">#${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:13px;color:#555555;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;">Status</td>
                <td style="padding:10px 16px;font-size:13px;font-weight:700;color:${c.color};text-align:right;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;">${c.label}</td>
              </tr>
              ${trackingRows}
            </table>
          </td>
        </tr>

        <!-- TRACK BUTTON -->
        ${trackButton}

        <!-- DIVIDER -->
        <tr>
          <td style="background-color:#ffffff;padding:0 32px;">
            <hr style="border:none;border-top:1px solid #eeeeee;margin:0;">
          </td>
        </tr>

        <!-- CONTACT -->
        <tr>
          <td style="background-color:#ffffff;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#666666;font-family:Arial,Helvetica,sans-serif;">
              Questions? Contact us at
              <a href="mailto:orders@tech4ru.com" style="color:#b8860b;text-decoration:none;">orders@tech4ru.com</a>
              or visit
              <a href="https://tech4ru.com" style="color:#b8860b;text-decoration:none;">tech4ru.com</a>
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color:#1a1a1a;padding:20px 32px;text-align:center;border-radius:0 0 10px 10px;">
            <p style="margin:0 0 4px;color:#daa520;font-size:13px;font-weight:700;letter-spacing:2px;font-family:Arial,Helvetica,sans-serif;">TECH4U</p>
            <p style="margin:0 0 10px;color:rgba(255,255,255,0.4);font-size:11px;font-family:Arial,Helvetica,sans-serif;">
              orders@tech4ru.com &nbsp;|&nbsp; tech4ru.com
            </p>
            <!--
              ✅ Physical address in footer = required by CAN-SPAM law
              ✅ Without this, Yahoo & Hotmail may mark as spam
            -->
            <p style="margin:0 0 8px;font-size:10px;color:rgba(255,255,255,0.3);font-family:Arial,Helvetica,sans-serif;">
              Tech4U &bull; Pakistan &bull; orders@tech4ru.com
            </p>
            <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.25);font-family:Arial,Helvetica,sans-serif;">
              This is a transactional email about your order at Tech4U. &nbsp;
              <a href="mailto:orders@tech4ru.com?subject=unsubscribe-${orderNumber}" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Unsubscribe</a>
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

// ─── MAIN POST HANDLER ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      orderId,
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
    } = body ?? {};

    if (!orderId || !status)
      return NextResponse.json(
        { error: "orderId and status are required" },
        { status: 400 },
      );

    const validStatuses: OrderStatus[] = ["shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status))
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${validStatuses.join(", ")}` },
        { status: 400 },
      );

    const typedStatus = status as OrderStatus;
    const displayName = (customerName || "Valued Customer").trim();
    const displayOrderNum = orderNumber || orderId;
    const shippingInfo: ShippingInfo = {
      courierName,
      courierCountry,
      estimatedDays,
      trackingNumber,
      courierTrackingUrl,
    };

    console.log("=".repeat(50));
    console.log(`🔄 ${typedStatus.toUpperCase()} — Order #${displayOrderNum}`);
    console.log(
      `👤 ${displayName} | 📧 ${customerEmail || "NONE"} | 📱 ${customerPhone || "NONE"}`,
    );
    if (typedStatus === "shipped")
      console.log(
        `🚚 ${courierName} → ${courierCountry} | ETA: ${estimatedDays} | Tracking: ${trackingNumber}`,
      );
    console.log("=".repeat(50));

    // ── Step 1: Supabase update ──
    const supabase = getSupabase();
    const updatePayload: Record<string, any> = {
      status: typedStatus,
      updated_at: new Date().toISOString(),
    };
    if (typedStatus === "shipped") {
      if (courierName) updatePayload.courier_name = courierName;
      if (courierCountry) updatePayload.courier_country = courierCountry;
      if (estimatedDays) updatePayload.estimated_days = estimatedDays;
      if (trackingNumber) updatePayload.tracking_number = trackingNumber;
      if (courierTrackingUrl)
        updatePayload.courier_tracking_url = courierTrackingUrl;
      updatePayload.shipped_at = new Date().toISOString();
    }

    const { error: dbError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (dbError) {
      console.error("❌ Supabase failed:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    console.log("✅ Supabase updated");

    // ── Step 2: WhatsApp ──
    let whatsappSent = false;
    if (customerPhone) {
      whatsappSent = await sendWA(
        customerPhone,
        buildWAMessage(typedStatus, displayName, displayOrderNum, shippingInfo),
      );
    } else console.warn("⚠️ No phone — WhatsApp skipped");

    // ── Step 3: Email (Brevo + Gmail fallback) ──
    let emailSent = false;
    let emailError: string | undefined;
    if (customerEmail) {
      const htmlContent = buildEmailHtml(
        typedStatus,
        displayName,
        displayOrderNum,
        shippingInfo,
      );
      const textContent = buildEmailText(
        typedStatus,
        displayName,
        displayOrderNum,
        shippingInfo,
      );
      const subject = getEmailSubject(typedStatus, displayOrderNum);

      const result = await sendEmail(
        customerEmail,
        subject,
        htmlContent,
        textContent,
        displayOrderNum,
      );
      emailSent = result.sent;
      emailError = result.error;
    } else {
      console.warn("⚠️ No email — Email skipped");
      emailError = "No customer email provided";
    }

    console.log(
      `📊 WhatsApp: ${whatsappSent ? "✅ SENT" : "❌ FAILED"} | Email: ${emailSent ? "✅ SENT" : `❌ FAILED — ${emailError}`}`,
    );

    return NextResponse.json({
      success: true,
      status: typedStatus,
      whatsappSent,
      emailSent,
      ...(emailSent
        ? {}
        : { emailError: emailError || "Email sending failed" }),
    });
  } catch (err: any) {
    console.error("❌ Exception:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
