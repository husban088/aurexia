// app/api/admin/update-order-status/route.ts
// COMPLETE FIX — Yahoo direct inbox
// email.ts ka sendStatusUpdateEmail use karo — woh already perfect hai

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendStatusUpdateEmail } from "@/lib/email";

// Supabase Client
function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Owner Alert Email — NO emojis, plain professional HTML
async function sendOwnerAlert(
  ownerEmails: string[],
  status: string,
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  extraInfo?: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  const statusLabel =
    status === "shipped"
      ? "SHIPPED"
      : status === "delivered"
        ? "DELIVERED"
        : "CANCELLED";

  const statusColor =
    status === "shipped"
      ? "#1d4ed8"
      : status === "delivered"
        ? "#16a34a"
        : "#dc2626";

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Order ${statusLabel} - Admin Alert</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:#1a1a1a;padding:24px 32px;">
              <h1 style="color:#daa520;margin:0;font-size:22px;letter-spacing:2px;font-family:'Segoe UI',Arial,sans-serif;">TECH4U Admin Alert</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px;background:${statusColor};">
              <p style="color:#fff;margin:0;font-size:16px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">Order ${statusLabel}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;width:40%;font-family:'Segoe UI',Arial,sans-serif;">Order Number</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#1a1a1a;font-weight:700;font-size:15px;font-family:'Segoe UI',Arial,sans-serif;">${orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Customer</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#1a1a1a;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Email</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;"><a href="mailto:${customerEmail}" style="color:#2563eb;">${customerEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Phone</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#1a1a1a;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${customerPhone || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Status</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:${statusColor};font-weight:700;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${statusLabel}</td>
                </tr>
                ${
                  extraInfo
                    ? `<tr>
                  <td style="padding:10px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Shipping Info</td>
                  <td style="padding:10px 0;color:#1a1a1a;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">${extraInfo}</td>
                </tr>`
                    : ""
                }
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;padding:16px 32px;text-align:center;">
              <p style="color:#888;margin:0;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">Tech4U Admin Panel — ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} PKT</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textBody = `TECH4U ADMIN ALERT — Order ${statusLabel}

Order Number : ${orderNumber}
Customer     : ${customerName}
Email        : ${customerEmail}
Phone        : ${customerPhone || "N/A"}
Status       : ${statusLabel}
${extraInfo ? `Shipping     : ${extraInfo}` : ""}

Time: ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} PKT
`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tech4U Orders <orders@tech4ru.com>",
        reply_to: "info@tech4ru.com",
        to: ownerEmails,
        subject: `Order ${orderNumber} - ${statusLabel} | Tech4U Admin`,
        html: htmlBody,
        text: textBody,
        headers: {
          "List-Unsubscribe": `<mailto:info@tech4ru.com?subject=unsubscribe-${uniqueId}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "X-Entity-Ref-ID": uniqueId,
          "X-Report-Abuse": "Please report abuse to: info@tech4ru.com",
          "Message-ID": `<${uniqueId}@tech4ru.com>`,
          "X-Mailer": "Tech4U-Transactional/2.0",
          "X-Priority": "3",
          Importance: "Normal",
          "Feedback-ID": `orders:tech4ru:resend`,
        },
      }),
    });
    const result = await response.json();
    if (response.ok && result.id) {
      console.log(`Owner alert sent! ID: ${result.id}`);
      return true;
    } else {
      console.error("Owner alert failed:", JSON.stringify(result));
      return false;
    }
  } catch (err) {
    console.error("Owner alert error:", err);
    return false;
  }
}

// WhatsApp messages — plain text, no emojis
function shippedWhatsAppMsg(
  name: string,
  orderNumber: string,
  courierName: string,
  trackingNumber: string,
  estimatedDays: string,
  trackingUrl: string,
): string {
  return `Your Order is Shipped - Tech4U

Hello ${name}! Great news!

Order: ${orderNumber}
Courier: ${courierName}
Tracking No: ${trackingNumber}
Estimated Delivery: ${estimatedDays}
${trackingUrl ? `Track your parcel: ${trackingUrl}` : ""}

For questions:
info@tech4ru.com
tech4ru.com

Thank you for choosing Tech4U!`;
}

function deliveredWhatsAppMsg(name: string, orderNumber: string): string {
  return `Order Delivered - Tech4U

Hello ${name}!

Your order ${orderNumber} has been successfully delivered!

We hope you love your purchase.

For questions:
info@tech4ru.com
tech4ru.com

Thank you for shopping with Tech4U!`;
}

function cancelledWhatsAppMsg(name: string, orderNumber: string): string {
  return `Order Cancelled - Tech4U

Hello ${name},

Your order ${orderNumber} has been cancelled.

If you have any questions or need help:
info@tech4ru.com
tech4ru.com

We hope to serve you again soon.`;
}

// MAIN POST HANDLER
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
      courierName,
      courierCountry,
      estimatedDays,
      trackingNumber,
      courierTrackingUrl,
    } = body;

    // Validate
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

    // Step 1: Supabase DB update
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
      console.error("DB update failed:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    console.log(`DB updated: Order ${orderNumber} -> ${status}`);

    // Step 2: Owner emails
    const ownerEmails = (
      process.env.OWNER_EMAILS ||
      process.env.OWNER_EMAIL ||
      "tech4ruu@gmail.com"
    )
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    // Step 3: Build WhatsApp message
    let whatsappMsg = "";
    let ownerExtraInfo: string | undefined;

    const cn = courierName || "Courier";
    const tn = trackingNumber || "N/A";
    const ed = estimatedDays || "3-5 business days";
    const tu = courierTrackingUrl || "";

    if (status === "shipped") {
      whatsappMsg = shippedWhatsAppMsg(
        customerName,
        orderNumber,
        cn,
        tn,
        ed,
        tu,
      );
      ownerExtraInfo = `${cn} | Tracking: ${tn} | Est: ${ed}`;
    } else if (status === "delivered") {
      whatsappMsg = deliveredWhatsAppMsg(customerName, orderNumber);
    } else if (status === "cancelled") {
      whatsappMsg = cancelledWhatsAppMsg(customerName, orderNumber);
    }

    // Step 4: Send all in parallel
    const [whatsappResult, customerEmailResult, ownerEmailResult] =
      await Promise.allSettled([
        // WhatsApp
        customerPhone
          ? sendWhatsAppMessage(customerPhone, whatsappMsg)
          : Promise.resolve(false),

        // Customer email — email.ts ka sendStatusUpdateEmail
        // Yeh function already perfect hai: text+html dono, anti-spam headers, no emojis
        sendStatusUpdateEmail(
          customerEmail,
          orderNumber,
          customerName,
          status as "shipped" | "delivered" | "cancelled",
          {
            courierName: courierName,
            courierCountry: courierCountry,
            trackingNumber: trackingNumber,
            estimatedDays: estimatedDays,
            courierTrackingUrl: courierTrackingUrl,
          },
        ),

        // Owner alert
        sendOwnerAlert(
          ownerEmails,
          status,
          orderNumber,
          customerName,
          customerEmail,
          customerPhone || "",
          ownerExtraInfo,
        ),
      ]);

    const whatsappSent =
      whatsappResult.status === "fulfilled" && whatsappResult.value === true;
    const customerEmailSent =
      customerEmailResult.status === "fulfilled" &&
      customerEmailResult.value === true;
    const ownerEmailSent =
      ownerEmailResult.status === "fulfilled" &&
      ownerEmailResult.value === true;

    console.log(`Notifications for ${orderNumber} (${status}):`, {
      whatsapp: whatsappSent ? "sent" : "failed",
      customerEmail: customerEmailSent ? "sent" : "failed",
      ownerEmail: ownerEmailSent ? "sent" : "failed",
    });

    return NextResponse.json({
      success: true,
      status,
      whatsappSent,
      emailSent: customerEmailSent,
      ownerEmailSent,
    });
  } catch (err: any) {
    console.error("update-order-status error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
