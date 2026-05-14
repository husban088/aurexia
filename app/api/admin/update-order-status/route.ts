// app/api/admin/update-order-status/route.ts
// ✅ COMPLETE — Shipped / Delivered / Cancelled
// WhatsApp (WaSender) + Email (Resend) dono jayenge
// Customer ko bhi, Owner ke saare emails ko bhi

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

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:32px;text-align:center;">
    <h1 style="color:#daa520;margin:0;font-size:26px;letter-spacing:2px;">TECH4U</h1>
    <p style="color:#aaa;margin:6px 0 0;font-size:13px;">tech4ru.com</p>
  </div>

  <!-- Shipped Banner -->
  <div style="background:#eff6ff;padding:28px 32px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.2);">
    <div style="font-size:48px;margin-bottom:10px;">🚚</div>
    <h2 style="color:#1e40af;margin:0;font-size:22px;">Your Order is On Its Way!</h2>
    <p style="color:#1d4ed8;margin:8px 0 0;font-size:15px;">Hello <strong>${customerName}</strong>! Your order has been shipped.</p>
  </div>

  <!-- Order Info -->
  <div style="padding:28px 32px;border-bottom:1px solid #f0f0f0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;width:45%;">Order Number</td>
        <td style="padding:8px 0;color:#1a1a1a;font-weight:700;font-size:15px;">${orderNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888;font-size:14px;">Courier</td>
        <td style="padding:8px 0;color:#1a1a1a;font-weight:600;font-size:14px;">🏢 ${courierName} (${courierCountry})</td>
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

  <!-- Track Button -->
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

  <!-- Footer -->
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

// ✅ OWNER ALERT EMAIL — Owner ke saare emails ko
function ownerAlertEmailHTML(
  status: string,
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  extraInfo?: string,
): string {
  const statusEmoji =
    status === "shipped" ? "🚚" : status === "delivered" ? "✅" : "❌";
  const statusColor =
    status === "shipped"
      ? "#1d4ed8"
      : status === "delivered"
        ? "#15803d"
        : "#991b1b";
  const statusBg =
    status === "shipped"
      ? "#eff6ff"
      : status === "delivered"
        ? "#f0fdf4"
        : "#fef2f2";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:${statusBg};padding:24px 32px;border-bottom:2px solid ${statusColor}20;">
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

// ─── MAIN POST HANDLER ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      orderId,
      status,
      customerEmail,
      customerPhone,
      customerName,
      orderNumber,
      // Shipped ke liye extra fields
      courierName,
      courierCountry,
      estimatedDays,
      trackingNumber,
      courierTrackingUrl,
    } = body;

    // ── Validate ──
    if (
      !orderId ||
      !status ||
      !customerEmail ||
      !customerName ||
      !orderNumber
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const validStatuses = ["shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    // ── Step 1: Supabase DB update ──
    const supabase = getClient();
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "shipped") {
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
      console.error("❌ DB update failed:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    console.log(`✅ DB updated: Order ${orderNumber} → ${status}`);

    // ── Step 2: Owner emails list ──
    const ownerEmails = (
      process.env.OWNER_EMAILS ||
      process.env.OWNER_EMAIL ||
      "tech4ruu@gmail.com"
    )
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    // ── Step 3: Build messages based on status ──
    let whatsappMsg = "";
    let customerEmailSubject = "";
    let customerEmailHTML = "";
    let ownerEmailSubject = "";
    let ownerEmailHTML = "";

    if (status === "shipped") {
      const cn = courierName || "Courier";
      const tn = trackingNumber || "N/A";
      const ed = estimatedDays || "3–5 business days";
      const tu = courierTrackingUrl || "";

      whatsappMsg = shippedWhatsAppMsg(
        customerName,
        orderNumber,
        cn,
        tn,
        ed,
        tu,
      );
      customerEmailSubject = `🚚 Your Order ${orderNumber} Has Been Shipped — Tech4U`;
      customerEmailHTML = shippedEmailHTML(
        customerName,
        orderNumber,
        cn,
        courierCountry || "",
        tn,
        ed,
        tu,
      );
      ownerEmailSubject = `🚚 Order ${orderNumber} Marked as Shipped`;
      ownerEmailHTML = ownerAlertEmailHTML(
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
      customerEmailHTML = deliveredEmailHTML(customerName, orderNumber);
      ownerEmailSubject = `✅ Order ${orderNumber} Delivered`;
      ownerEmailHTML = ownerAlertEmailHTML(
        status,
        orderNumber,
        customerName,
        customerEmail,
        customerPhone || "",
      );
    } else if (status === "cancelled") {
      whatsappMsg = cancelledWhatsAppMsg(customerName, orderNumber);
      customerEmailSubject = `❌ Your Order ${orderNumber} Has Been Cancelled — Tech4U`;
      customerEmailHTML = cancelledEmailHTML(customerName, orderNumber);
      ownerEmailSubject = `❌ Order ${orderNumber} Cancelled`;
      ownerEmailHTML = ownerAlertEmailHTML(
        status,
        orderNumber,
        customerName,
        customerEmail,
        customerPhone || "",
      );
    }

    // ── Step 4: Send all notifications in parallel ──
    const [whatsappResult, customerEmailResult, ownerEmailResult] =
      await Promise.allSettled([
        // WhatsApp → Customer
        customerPhone
          ? sendWhatsAppMessage(customerPhone, whatsappMsg)
          : Promise.resolve(false),

        // Email → Customer
        sendResendEmail(customerEmail, customerEmailSubject, customerEmailHTML),

        // Email → Owner (saare emails)
        sendResendEmail(ownerEmails, ownerEmailSubject, ownerEmailHTML),
      ]);

    const whatsappSent =
      whatsappResult.status === "fulfilled" && whatsappResult.value === true;
    const customerEmailSent =
      customerEmailResult.status === "fulfilled" &&
      customerEmailResult.value === true;
    const ownerEmailSent =
      ownerEmailResult.status === "fulfilled" &&
      ownerEmailResult.value === true;

    console.log(`📊 Notifications for ${orderNumber} (${status}):`, {
      whatsapp: whatsappSent ? "✅" : "❌",
      customerEmail: customerEmailSent ? "✅" : "❌",
      ownerEmail: ownerEmailSent ? "✅" : "❌",
    });

    return NextResponse.json({
      success: true,
      status,
      whatsappSent,
      emailSent: customerEmailSent, // page.tsx yeh expect karta hai
      ownerEmailSent,
    });
  } catch (err: any) {
    console.error("❌ update-order-status error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
