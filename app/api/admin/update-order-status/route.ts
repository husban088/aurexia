// ✅ FILE PATH: app/api/admin/update-order-status/route.ts
// ✅ Shipped → Courier info save + WhatsApp+Email → ALL COUNTRIES (UK, USA, Australia, Pakistan)
// ✅ nodemailer → Gmail SMTP → kisi bhi email pe chale ga
// ✅ WasenderAPI → International WhatsApp → UK +44, USA +1, AU +61, PK +92

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Phone Formatter — IMPROVED FOR ALL COUNTRIES ────────────────────────────
// UK:         +447911123456  or  07911123456  → +447911123456
// USA:        +12125551234   or  2125551234   → +12125551234
// Australia:  +61412345678   or  0412345678   → +61412345678
// Pakistan:   +923001234567  or  03001234567  → +923001234567

function formatPhone(phone: string): string {
  if (!phone) return "";
  // Remove spaces, dashes, parentheses, dots
  let clean = phone.trim().replace(/[\s\-\(\)\.]/g, "");

  // Already E.164 format (+country code)
  if (clean.startsWith("+")) {
    return "+" + clean.slice(1).replace(/\D/g, "");
  }

  // Pakistan local: 03XXXXXXXXX → +923XXXXXXXXX
  if (clean.startsWith("0") && clean.length === 11 && clean[1] === "3") {
    return "+92" + clean.slice(1).replace(/\D/g, "");
  }

  // UK local: 07XXXXXXXXX → +447XXXXXXXXX
  if (clean.startsWith("07") && clean.length === 11) {
    return "+44" + clean.slice(1).replace(/\D/g, "");
  }

  // Australia local: 04XXXXXXXXX → +614XXXXXXXXX
  if (clean.startsWith("04") && clean.length === 10) {
    return "+61" + clean.slice(1).replace(/\D/g, "");
  }

  // Already has country code but no +
  const digits = clean.replace(/\D/g, "");
  return "+" + digits;
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

// ─── WhatsApp via WasenderAPI ─────────────────────────────────────────────────
async function sendWA(to: string, message: string): Promise<boolean> {
  const apiKey = process.env.WASENDER_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ WASENDER_API_KEY missing — check .env.local");
    return false;
  }

  const toFormatted = formatPhone(to);
  if (!toFormatted || toFormatted.length < 8) {
    console.warn("⚠️ Invalid phone number:", to, "→", toFormatted);
    return false;
  }

  console.log(`📱 Sending WhatsApp → ${toFormatted}`);

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
      console.log(`✅ WhatsApp sent! MsgID: ${r.data?.msgId} → ${toFormatted}`);
      return true;
    }

    console.error(`❌ WhatsApp error (${toFormatted}):`, JSON.stringify(r));
    return false;
  } catch (e: any) {
    console.error(`❌ WhatsApp fetch error (${toFormatted}):`, e.message);
    return false;
  }
}

// ─── Email via SMTP ───────────────────────────────────────────────────────────
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<boolean> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.warn("⚠️ SMTP_USER or SMTP_PASS missing — check .env.local");
    return false;
  }

  // Basic email validation
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.warn("⚠️ Invalid email address:", to);
    return false;
  }

  console.log(`📧 Sending Email → ${to}`);

  try {
    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // TLS
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 15000,
      socketTimeout: 20000,
    } as any);

    const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;

    await transporter.sendMail({
      from: `"Tech4U" <${fromEmail}>`,
      to: to,
      replyTo: fromEmail,
      subject: subject,
      html: html,
      text: text,
    });

    console.log(`✅ Email sent! → ${to}`);
    return true;
  } catch (e: any) {
    console.error(`❌ Email error (${to}):`, e.message);
    return false;
  }
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

// ─── WhatsApp Message Builders ────────────────────────────────────────────────
function buildWAMessage(
  status: OrderStatus,
  name: string,
  orderNumber: string,
  shipping?: ShippingInfo,
): string {
  if (status === "shipped") {
    let trackingSection = "";
    if (shipping?.trackingNumber) {
      trackingSection = `\n\n📦 *Tracking Number:* \`${shipping.trackingNumber}\``;
      if (shipping?.courierTrackingUrl) {
        trackingSection += `\n🔗 *Track Your Parcel:*\n${shipping.courierTrackingUrl}`;
      }
    }

    return `🚚 *Order Shipped — Tech4U*

Hello *${name}*! Your order is on the way! 🎉

━━━━━━━━━━━━━━━━━
📦 *Order #${orderNumber}* has been shipped!
━━━━━━━━━━━━━━━━━

🏢 *Courier:* ${shipping?.courierName || "Our delivery partner"}
🌍 *Ship To:* ${shipping?.courierCountry || ""}
⏱ *Est. Delivery:* ${shipping?.estimatedDays || "2–5 business days"}${trackingSection}

━━━━━━━━━━━━━━━━━

Questions? Contact us:
📧 info@tech4ru.com
🌐 tech4ru.com

Thank you for choosing Tech4U! ✨`;
  }

  if (status === "delivered") {
    return `✅ *Order Delivered — Tech4U*

Hello *${name}*! 🎉

━━━━━━━━━━━━━━━━━
📦 *Order #${orderNumber}* has been DELIVERED!
━━━━━━━━━━━━━━━━━

We hope you love your purchase! 😊

Please leave us a review at:
🌐 tech4ru.com

Questions?
📧 info@tech4ru.com

Thank you for choosing Tech4U! ⭐`;
  }

  // cancelled
  return `❌ *Order Cancelled — Tech4U*

Hello *${name}*,

━━━━━━━━━━━━━━━━━
📦 *Order #${orderNumber}* has been cancelled.
━━━━━━━━━━━━━━━━━

We're sorry about this.
If you have any questions, please contact us:

📧 info@tech4ru.com
🌐 tech4ru.com

We hope to serve you again soon.
— Tech4U Team`;
}

// ─── Email HTML Templates ─────────────────────────────────────────────────────
function buildEmailHtml(
  status: OrderStatus,
  name: string,
  orderNumber: string,
  shipping?: ShippingInfo,
): string {
  // Tracking rows for shipped
  let trackingRows = "";
  if (status === "shipped") {
    if (shipping?.courierName) {
      trackingRows += `
        <tr>
          <td style="padding:8px 12px;font-size:13px;color:#666;border-bottom:1px solid #f0ebe0;">Courier</td>
          <td style="padding:8px 12px;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right;border-bottom:1px solid #f0ebe0;">${shipping.courierName}</td>
        </tr>`;
    }
    if (shipping?.courierCountry) {
      trackingRows += `
        <tr>
          <td style="padding:8px 12px;font-size:13px;color:#666;border-bottom:1px solid #f0ebe0;">Ship To</td>
          <td style="padding:8px 12px;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right;border-bottom:1px solid #f0ebe0;">${shipping.courierCountry}</td>
        </tr>`;
    }
    if (shipping?.estimatedDays) {
      trackingRows += `
        <tr>
          <td style="padding:8px 12px;font-size:13px;color:#666;border-bottom:1px solid #f0ebe0;">Est. Delivery</td>
          <td style="padding:8px 12px;font-size:13px;font-weight:700;color:#b8860b;text-align:right;border-bottom:1px solid #f0ebe0;">${shipping.estimatedDays}</td>
        </tr>`;
    }
    if (shipping?.trackingNumber) {
      trackingRows += `
        <tr>
          <td style="padding:8px 12px;font-size:13px;color:#666;border-bottom:1px solid #f0ebe0;">Tracking #</td>
          <td style="padding:8px 12px;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right;border-bottom:1px solid #f0ebe0;font-family:monospace;">${shipping.trackingNumber}</td>
        </tr>`;
    }
    if (shipping?.courierTrackingUrl) {
      trackingRows += `
        <tr>
          <td style="padding:8px 12px;font-size:13px;color:#666;">Track Live</td>
          <td style="padding:8px 12px;font-size:13px;text-align:right;">
            <a href="${shipping.courierTrackingUrl}" style="color:#b8860b;font-weight:600;text-decoration:none;">
              🔗 Click to Track Your Parcel →
            </a>
          </td>
        </tr>`;
    }
  }

  const configs = {
    shipped: {
      emoji: "🚚",
      label: "Order Shipped",
      badgeColor: "#1565c0",
      badgeBg: "#e3f2fd",
      heading: "Your Order Is On Its Way! 🚚",
      bodyHtml: `Hello <strong>${name}</strong>!<br><br>
Great news — your order <strong>#${orderNumber}</strong> has been <strong>shipped</strong> and is heading your way!<br><br>
You can track your parcel using the tracking information below.<br><br>
Thank you for shopping with <strong>Tech4U</strong>! 😊`,
    },
    delivered: {
      emoji: "✅",
      label: "Order Delivered",
      badgeColor: "#1b5e20",
      badgeBg: "#e8f5e9",
      heading: "Your Order Has Been Delivered! 🎉",
      bodyHtml: `Hello <strong>${name}</strong>!<br><br>
Your order <strong>#${orderNumber}</strong> has been <strong>successfully delivered</strong>! 🎉<br><br>
We hope you love your purchase! Please leave us a review at 
<a href="https://tech4ru.com" style="color:#b8860b;">tech4ru.com</a>.<br><br>
For any questions: <a href="mailto:info@tech4ru.com" style="color:#b8860b;">info@tech4ru.com</a><br><br>
Thank you for choosing <strong>Tech4U</strong>! ⭐`,
    },
    cancelled: {
      emoji: "❌",
      label: "Order Cancelled",
      badgeColor: "#b71c1c",
      badgeBg: "#ffebee",
      heading: "Your Order Has Been Cancelled",
      bodyHtml: `Hello <strong>${name}</strong>,<br><br>
We're sorry — your order <strong>#${orderNumber}</strong> has been <strong>cancelled</strong>.<br><br>
If you have any questions or need assistance, please contact us immediately:<br>
<a href="mailto:info@tech4ru.com" style="color:#b8860b;">info@tech4ru.com</a><br><br>
We hope to serve you again soon.<br>
— <strong>Tech4U Team</strong>`,
    },
  };

  const c = configs[status];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${c.label} — Tech4U</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:36px 32px;text-align:center;">
              <h1 style="color:#daa520;margin:0;font-size:30px;letter-spacing:3px;font-weight:800;">TECH4U</h1>
              <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;letter-spacing:1px;">ORDER UPDATE</p>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding:32px 32px 0;text-align:center;">
              <div style="display:inline-block;background:${c.badgeBg};border-radius:50px;padding:12px 28px;margin-bottom:12px;">
                <span style="font-size:20px;">${c.emoji}</span>
                <span style="font-size:16px;font-weight:700;color:${c.badgeColor};margin-left:8px;vertical-align:middle;">${c.label}</span>
              </div>
              <h2 style="color:#1a1a1a;margin:8px 0 0;font-size:21px;font-weight:700;">${c.heading}</h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:20px 32px 0;">
              <p style="color:#444;font-size:14px;line-height:1.9;margin:0;">${c.bodyHtml}</p>
            </td>
          </tr>

          <!-- Order Details Table -->
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border-radius:12px;border:1px solid #f0ebe0;overflow:hidden;">
                <tr>
                  <td style="padding:8px 12px;font-size:13px;color:#666;border-bottom:1px solid #f0ebe0;">Order Number</td>
                  <td style="padding:8px 12px;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right;border-bottom:1px solid #f0ebe0;">#${orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px;font-size:13px;color:#666;border-bottom:1px solid #f0ebe0;">Status</td>
                  <td style="padding:8px 12px;font-size:13px;font-weight:700;color:${c.badgeColor};text-align:right;border-bottom:1px solid #f0ebe0;">${c.emoji} ${c.label}</td>
                </tr>
                ${trackingRows}
              </table>
            </td>
          </tr>

          <!-- CTA Button (only for shipped with tracking URL) -->
          ${
            status === "shipped" && shipping?.courierTrackingUrl
              ? `
          <tr>
            <td style="padding:0 32px 24px;text-align:center;">
              <a href="${shipping.courierTrackingUrl}"
                style="display:inline-block;background:linear-gradient(135deg,#daa520,#b8860b);color:#1a1a1a;font-weight:700;font-size:14px;padding:14px 36px;border-radius:50px;text-decoration:none;letter-spacing:0.5px;">
                📦 Track My Order →
              </a>
            </td>
          </tr>`
              : ""
          }

          <!-- Contact -->
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <p style="color:#999;font-size:12px;margin:0;">
                Questions? Email us at 
                <a href="mailto:info@tech4ru.com" style="color:#b8860b;text-decoration:none;">info@tech4ru.com</a>
                &nbsp;|&nbsp;
                <a href="https://tech4ru.com" style="color:#b8860b;text-decoration:none;">tech4ru.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;padding:24px 32px;text-align:center;">
              <p style="color:#daa520;margin:0 0 6px;font-size:14px;font-weight:700;letter-spacing:2px;">TECH4U</p>
              <p style="color:rgba(255,255,255,0.45);margin:0;font-size:11px;">
                info@tech4ru.com &nbsp;|&nbsp; tech4ru.com
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

// ─── Email Subject ─────────────────────────────────────────────────────────────
function getEmailSubject(status: OrderStatus, orderNumber: string): string {
  const subjects: Record<OrderStatus, string> = {
    shipped: `🚚 Your Order #${orderNumber} Has Been Shipped — Tech4U`,
    delivered: `✅ Your Order #${orderNumber} Has Been Delivered — Tech4U`,
    cancelled: `❌ Your Order #${orderNumber} Has Been Cancelled — Tech4U`,
  };
  return subjects[status];
}

// ─── MAIN POST HANDLER ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Parse body safely
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
      // Shipping fields (only for "shipped")
      courierName,
      courierCountry,
      estimatedDays,
      trackingNumber,
      courierTrackingUrl,
    } = body ?? {};

    // ── Validation ──
    if (!orderId || !status) {
      return NextResponse.json(
        { error: "orderId and status are required" },
        { status: 400 },
      );
    }

    const validStatuses: OrderStatus[] = ["shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

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

    // ── Logging ──
    console.log("=".repeat(50));
    console.log(
      `🔄 STATUS UPDATE: ${typedStatus.toUpperCase()} — Order #${displayOrderNum}`,
    );
    console.log(`👤 Name: ${displayName}`);
    console.log(`📧 Email: ${customerEmail || "NOT PROVIDED"}`);
    console.log(`📱 Phone: ${customerPhone || "NOT PROVIDED"}`);
    if (typedStatus === "shipped") {
      console.log(`🚚 Courier: ${courierName} | Country: ${courierCountry}`);
      console.log(`⏱ ETA: ${estimatedDays} | Tracking: ${trackingNumber}`);
      console.log(`🔗 URL: ${courierTrackingUrl}`);
    }
    console.log("=".repeat(50));

    // ── Step 1: Update Supabase ──
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
      console.error("❌ Supabase update failed:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    console.log("✅ Supabase order updated successfully");

    // ── Step 2: Send WhatsApp ──
    let whatsappSent = false;

    if (customerPhone) {
      const waMessage = buildWAMessage(
        typedStatus,
        displayName,
        displayOrderNum,
        shippingInfo,
      );
      whatsappSent = await sendWA(customerPhone, waMessage);
    } else {
      console.warn("⚠️ No phone number — WhatsApp skipped");
    }

    // ── Step 3: Send Email ──
    let emailSent = false;

    if (customerEmail) {
      const subject = getEmailSubject(typedStatus, displayOrderNum);
      const htmlContent = buildEmailHtml(
        typedStatus,
        displayName,
        displayOrderNum,
        shippingInfo,
      );
      const textContent = buildWAMessage(
        typedStatus,
        displayName,
        displayOrderNum,
        shippingInfo,
      );
      emailSent = await sendEmail(
        customerEmail,
        subject,
        htmlContent,
        textContent,
      );
    } else {
      console.warn("⚠️ No email address — Email skipped");
    }

    // ── Final Result ──
    console.log(
      `📊 RESULT — WhatsApp: ${whatsappSent ? "✅ SENT" : "❌ FAILED"} | Email: ${emailSent ? "✅ SENT" : "❌ FAILED"}`,
    );

    return NextResponse.json({
      success: true,
      status: typedStatus,
      whatsappSent,
      emailSent,
    });
  } catch (err: any) {
    console.error("❌ update-order-status EXCEPTION:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
