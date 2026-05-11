// app/api/admin/update-order-status/route.ts
// ✅ Shipped → Courier info save + WhatsApp+Email mein FULL tracking details with LINK

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Phone Formatter ──────────────────────────────────────────────────────────
function formatPhone(phone: string): string {
  let clean = phone.trim().replace(/[\s\-\(\)\.]/g, "");
  if (clean.startsWith("+")) return "+" + clean.slice(1).replace(/\D/g, "");
  if (clean.startsWith("0") && clean.length === 11 && clean[1] === "3")
    return "+92" + clean.slice(1).replace(/\D/g, "");
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

// ─── WhatsApp via WasenderAPI ─────────────────────────────────────────────────
async function sendWA(to: string, message: string): Promise<boolean> {
  const apiKey = process.env.WASENDER_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ WASENDER_API_KEY missing");
    return false;
  }
  const toF = formatPhone(to);
  try {
    const res = await fetch("https://www.wasenderapi.com/api/send-message", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: toF, text: message }),
    });
    const r = await res.json();
    if (res.ok && r.success) {
      console.log(`✅ WA sent → ${toF}`);
      return true;
    }
    console.error("❌ WA error:", JSON.stringify(r));
    return false;
  } catch (e: any) {
    console.error("❌ WA fetch error:", e.message);
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
  try {
    const nodemailer = await import("nodemailer");
    const t = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      socketTimeout: 15000,
    } as any);
    const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    await t.sendMail({
      from: `"Tech4U Orders" <${from}>`,
      to,
      replyTo: from,
      subject,
      html,
      text,
    });
    console.log(`✅ Email sent → ${to}`);
    return true;
  } catch (e: any) {
    console.error("❌ Email error:", e.message);
    return false;
  }
}

// ─── Message Builders ─────────────────────────────────────────────────────────
type OrderStatus = "shipped" | "delivered" | "cancelled";

interface ShippingInfo {
  courierName?: string;
  courierCountry?: string;
  estimatedDays?: string;
  trackingNumber?: string;
  courierTrackingUrl?: string;
}

function buildWAMessage(
  status: OrderStatus,
  name: string,
  orderNumber: string,
  shipping?: ShippingInfo,
): string {
  if (status === "shipped") {
    let trackingText = "";
    if (shipping?.trackingNumber) {
      trackingText = `\n\n📦 *Tracking Number:* ${shipping.trackingNumber}`;
      if (shipping?.courierTrackingUrl) {
        trackingText += `\n🔗 *Track Live:* ${shipping.courierTrackingUrl}`;
      }
    }
    return `🚚 *Order Shipped — Tech4U*

Hello *${name}*! Great news!

━━━━━━━━━━━━━━━━━
📦 *Order #${orderNumber}* has been shipped!
━━━━━━━━━━━━━━━━━

🏢 *Courier:* ${shipping?.courierName || "Our delivery partner"}
🌍 *Delivery Country:* ${shipping?.courierCountry || ""}
⏱ *Estimated Delivery:* ${shipping?.estimatedDays || "2–5 business days"}${trackingText}

Your order is on its way! 🎉

For any questions:
📧 info@tech4ru.com
🌐 tech4ru.com

Thank you for choosing Tech4U! ✨`;
  }

  if (status === "delivered") {
    return `✅ *Order Delivered — Tech4U*

Hello *${name}*! 🎉

━━━━━━━━━━━━━━━━━
📦 *Order #${orderNumber}* has been delivered!
━━━━━━━━━━━━━━━━━

We hope you love your purchase! 😊
Please leave us a review at tech4ru.com

For any questions:
📧 info@tech4ru.com

Thank you for choosing Tech4U! ⭐`;
  }

  return `❌ *Order Cancelled — Tech4U*

Hello *${name}*,

━━━━━━━━━━━━━━━━━
📦 *Order #${orderNumber}* has been cancelled.
━━━━━━━━━━━━━━━━━

We're sorry your order was cancelled.
If you have questions, please contact us immediately.

📧 info@tech4ru.com
🌐 tech4ru.com

We hope to serve you again soon.
— Tech4U Team`;
}

function buildEmailHtml(
  status: OrderStatus,
  name: string,
  orderNumber: string,
  shipping?: ShippingInfo,
): string {
  // Build tracking info HTML
  let trackingHtml = "";
  if (status === "shipped" && shipping?.trackingNumber) {
    trackingHtml = `
      <tr>
        <td style="font-size:13px;color:#666;">Tracking Number</td>
        <td style="font-size:13px;font-weight:700;color:#1a1a1a;text-align:right;">${shipping.trackingNumber}</td>
      </tr>
    `;
    if (shipping?.courierTrackingUrl) {
      trackingHtml += `
      <tr>
        <td style="font-size:13px;color:#666;">Track Live</td>
        <td style="font-size:13px;text-align:right;">
          <a href="${shipping.courierTrackingUrl}" style="color:#b8860b;">🔗 Click to Track →</a>
        </td>
      </tr>
      `;
    }
  }

  const cfg = {
    shipped: {
      emoji: "🚚",
      label: "Shipped",
      color: "#1565c0",
      bg: "#e3f2fd",
      heading: "Your Order Is On Its Way! 🚚",
      body: `Hello <strong>${name}</strong>!<br><br>
      Great news — your order <strong>#${orderNumber}</strong> has been shipped!<br><br>
      ${shipping?.courierName ? `<strong>🏢 Courier:</strong> ${shipping.courierName}<br>` : ""}
      ${shipping?.courierCountry ? `<strong>🌍 Country:</strong> ${shipping.courierCountry}<br>` : ""}
      ${shipping?.estimatedDays ? `<strong>⏱ Estimated Delivery:</strong> ${shipping.estimatedDays}<br>` : ""}
      <br>Thank you for shopping with Tech4U! 😊`,
    },
    delivered: {
      emoji: "✅",
      label: "Delivered",
      color: "#1b5e20",
      bg: "#e8f5e9",
      heading: "Your Order Has Been Delivered! ✅",
      body: `Hello <strong>${name}</strong>!<br><br>Your order <strong>#${orderNumber}</strong> has been <strong>delivered</strong>! 🎉<br><br>We hope you love your purchase. Please leave us a review at <a href="https://tech4ru.com" style="color:#b8860b;">tech4ru.com</a>.<br><br>For any questions: <a href="mailto:info@tech4ru.com" style="color:#b8860b;">info@tech4ru.com</a><br><br>Thank you for choosing Tech4U! ⭐`,
    },
    cancelled: {
      emoji: "❌",
      label: "Cancelled",
      color: "#b71c1c",
      bg: "#ffebee",
      heading: "Your Order Has Been Cancelled",
      body: `Hello <strong>${name}</strong>,<br><br>We're sorry — your order <strong>#${orderNumber}</strong> has been <strong>cancelled</strong>.<br><br>For questions: <a href="mailto:info@tech4ru.com" style="color:#b8860b;">info@tech4ru.com</a><br><br>We hope to serve you again soon.<br>— Tech4U Team`,
    },
  }[status];

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);max-width:600px;">
        <tr>
          <td style="background:#1a1a1a;padding:32px;text-align:center;">
            <h1 style="color:#daa520;margin:0;font-size:28px;letter-spacing:2px;">TECH4U</h1>
            <p style="color:#fff;margin:8px 0 0;font-size:14px;opacity:0.8;">Order Update</p>
           </td>
         </tr>
        <tr>
          <td style="padding:28px 32px 0;text-align:center;">
            <div style="display:inline-block;background:${cfg.bg};border-radius:50px;padding:12px 28px;margin-bottom:16px;">
              <span style="font-size:22px;">${cfg.emoji}</span>
              <span style="font-size:17px;font-weight:700;color:${cfg.color};margin-left:8px;vertical-align:middle;">${cfg.label}</span>
            </div>
            <h2 style="color:#1a1a1a;margin:0 0 8px;font-size:20px;">${cfg.heading}</h2>
           </td>
         </tr>
        <tr>
          <td style="padding:16px 32px 0;">
            <p style="color:#444;font-size:14px;line-height:1.9;margin:0;">${cfg.body}</p>
           </td>
         </tr>
        <tr>
          <td style="padding:20px 32px;">
            <table width="100%" cellpadding="8" cellspacing="0" style="background:#f9f6f0;border-radius:12px;">
              <tr>
                <td style="font-size:13px;color:#666;">Order Number</td>
                <td style="font-size:13px;font-weight:700;color:#1a1a1a;text-align:right;">#${orderNumber}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#666;">Status</td>
                <td style="font-size:13px;font-weight:700;color:${cfg.color};text-align:right;">${cfg.emoji} ${cfg.label}</td>
              </tr>
              ${
                status === "shipped" && shipping?.courierName
                  ? `
              <tr>
                <td style="font-size:13px;color:#666;">Courier</td>
                <td style="font-size:13px;font-weight:700;color:#1a1a1a;text-align:right;">${shipping.courierName}</td>
              </tr>`
                  : ""
              }
              ${
                status === "shipped" && shipping?.estimatedDays
                  ? `
              <tr>
                <td style="font-size:13px;color:#666;">Est. Delivery</td>
                <td style="font-size:13px;font-weight:700;color:#b8860b;text-align:right;">${shipping.estimatedDays}</td>
              </tr>`
                  : ""
              }
              ${trackingHtml}
            </table>
           </td>
         </tr>
        <tr>
          <td style="background:#1a1a1a;padding:24px 32px;text-align:center;">
            <p style="color:#daa520;margin:0 0 8px;font-size:13px;font-weight:600;">TECH4U</p>
            <p style="color:#888;margin:0;font-size:12px;">info@tech4ru.com | tech4ru.com</p>
           </td>
         </tr>
       </table>
     </td>
   </tr>
</table>
</body>
</html>`;
}

function getEmailSubject(status: OrderStatus, orderNumber: string): string {
  if (status === "shipped")
    return `🚚 Your Order #${orderNumber} Has Been Shipped — Tech4U`;
  if (status === "delivered")
    return `✅ Your Order #${orderNumber} Has Been Delivered — Tech4U`;
  return `❌ Your Order #${orderNumber} Has Been Cancelled — Tech4U`;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
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
      // Shipping fields (only for "shipped")
      courierName,
      courierCountry,
      estimatedDays,
      trackingNumber,
      courierTrackingUrl,
    } = body ?? {};

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "orderId and status are required" },
        { status: 400 },
      );
    }

    const validStatuses: OrderStatus[] = ["shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    const typedStatus = status as OrderStatus;
    const displayName = (customerName || "").trim() || "Valued Customer";
    const displayOrderNum = orderNumber || orderId;
    const shipping: ShippingInfo = {
      courierName,
      courierCountry,
      estimatedDays,
      trackingNumber,
      courierTrackingUrl,
    };

    console.log("====================================");
    console.log(`🔄 ${typedStatus.toUpperCase()} — #${displayOrderNum}`);
    console.log(
      `👤 ${displayName} | 📧 ${customerEmail} | 📱 ${customerPhone}`,
    );
    if (typedStatus === "shipped") {
      console.log(
        `🚚 Courier: ${courierName} (${courierCountry}) | ETA: ${estimatedDays} | Tracking: ${trackingNumber} | URL: ${courierTrackingUrl}`,
      );
    }
    console.log("====================================");

    // ── Step 1: Build Supabase update payload ──
    const supabase = getSupabase();

    const updatePayload: Record<string, any> = {
      status: typedStatus,
      updated_at: new Date().toISOString(),
    };

    // Agar shipped hai → courier info bhi save karo
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
      console.error("❌ Supabase error:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    console.log("✅ Supabase updated");

    let whatsappSent = false;
    let emailSent = false;

    // ── Step 2: WhatsApp ──
    if (customerPhone) {
      const msg = buildWAMessage(
        typedStatus,
        displayName,
        displayOrderNum,
        shipping,
      );
      whatsappSent = await sendWA(customerPhone, msg);
    }

    // ── Step 3: Email ──
    if (customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      const subject = getEmailSubject(typedStatus, displayOrderNum);
      const html = buildEmailHtml(
        typedStatus,
        displayName,
        displayOrderNum,
        shipping,
      );
      const text = buildWAMessage(
        typedStatus,
        displayName,
        displayOrderNum,
        shipping,
      );
      emailSent = await sendEmail(customerEmail, subject, html, text);
    }

    console.log(`📊 WA: ${whatsappSent} | Email: ${emailSent}`);

    return NextResponse.json({
      success: true,
      status: typedStatus,
      whatsappSent,
      emailSent,
    });
  } catch (err: any) {
    console.error("❌ update-order-status error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
