// app/api/admin/update-order-status/route.ts
// COMPLETE — Yahoo + Hotmail inbox delivery
// Full order details email mein — currency convert with country

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendStatusUpdateEmail } from "@/lib/email";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Owner Alert — NO links, plain text + HTML, full anti-spam headers
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
<head><meta charset="UTF-8"><title>Order ${statusLabel} - Admin</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#1a1a1a;padding:20px 28px;">
          <p style="color:#daa520;margin:0;font-size:20px;letter-spacing:2px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">TECH4U Admin</p>
        </td></tr>
        <tr><td style="padding:6px 28px;background:${statusColor};">
          <p style="color:#fff;margin:0;font-size:14px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">Order ${statusLabel}</p>
        </td></tr>
        <tr><td style="padding:24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:12px;width:40%;font-family:'Segoe UI',Arial,sans-serif;">Order</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#1a1a1a;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">${orderNumber}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">Customer</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#1a1a1a;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">${customerName}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">Email</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#1a1a1a;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">${customerEmail}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">Phone</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#1a1a1a;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">${customerPhone || "N/A"}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">Status</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:${statusColor};font-weight:700;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">${statusLabel}</td></tr>
            ${extraInfo ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">Info</td><td style="padding:8px 0;color:#1a1a1a;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">${extraInfo}</td></tr>` : ""}
          </table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:12px 28px;text-align:center;">
          <p style="color:#aaa;margin:0;font-size:11px;font-family:'Segoe UI',Arial,sans-serif;">${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} PKT — To unsubscribe reply: unsubscribe</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textBody = `TECH4U ADMIN — Order ${statusLabel}
Order    : ${orderNumber}
Customer : ${customerName}
Email    : ${customerEmail}
Phone    : ${customerPhone || "N/A"}
Status   : ${statusLabel}
${extraInfo ? `Info     : ${extraInfo}` : ""}
Time     : ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} PKT
`;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tech4U Orders <orders@tech4ru.com>",
        reply_to: "info@tech4ru.com",
        to: ownerEmails,
        subject: `Order ${orderNumber} - ${statusLabel} | Tech4U`,
        html: htmlBody,
        text: textBody,
        headers: {
          "List-Unsubscribe": `<mailto:info@tech4ru.com?subject=unsubscribe-admin-${uniqueId}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "Message-ID": `<admin-${uniqueId}@tech4ru.com>`,
          "X-Entity-Ref-ID": `admin-${uniqueId}`,
          "X-Report-Abuse": "Please report abuse to: abuse@tech4ru.com",
          "X-Mailer": "Tech4U-Transactional/2.0",
          "X-Priority": "3",
          Importance: "Normal",
          "Feedback-ID": "transactional-admin:tech4ru:resend",
          "X-MS-Exchange-Organization-SCL": "-1",
        },
      }),
    });
    const result = await resp.json();
    if (resp.ok && result.id) {
      console.log("Owner alert sent:", result.id);
      return true;
    }
    console.error("Owner alert failed:", JSON.stringify(result));
    return false;
  } catch (err) {
    console.error("Owner alert error:", err);
    return false;
  }
}

// WhatsApp messages — plain text
function shippedWA(
  name: string,
  orderNumber: string,
  courierName: string,
  trackingNumber: string,
  estimatedDays: string,
): string {
  return `Order Shipped - Tech4U

Hello ${name}! Your order is on its way.

Order: ${orderNumber}
Courier: ${courierName}
Tracking: ${trackingNumber}
Estimated: ${estimatedDays}

Questions: info@tech4ru.com`;
}

function deliveredWA(name: string, orderNumber: string): string {
  return `Order Delivered - Tech4U

Hello ${name}!

Your order ${orderNumber} has been delivered!

We hope you love your purchase.

Questions: info@tech4ru.com`;
}

function cancelledWA(name: string, orderNumber: string): string {
  return `Order Cancelled - Tech4U

Hello ${name},

Your order ${orderNumber} has been cancelled.

Questions: info@tech4ru.com`;
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
      // NEW — full order details
      orderItems,
      subtotal,
      shippingCost,
      totalAmount,
      shippingAddress,
      paymentMethod,
      customerCountry,
    } = body;

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
        { error: `Invalid status: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    // Step 1: DB update
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
      console.error("DB error:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Step 2: Owner emails list
    const ownerEmails = (
      process.env.OWNER_EMAILS ||
      process.env.OWNER_EMAIL ||
      "tech4ruu@gmail.com"
    )
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    // Step 3: WhatsApp + extra info
    let whatsappMsg = "";
    let ownerExtraInfo: string | undefined;
    const cn = courierName || "Courier";
    const tn = trackingNumber || "N/A";
    const ed = estimatedDays || "3-5 business days";

    if (status === "shipped") {
      whatsappMsg = shippedWA(customerName, orderNumber, cn, tn, ed);
      ownerExtraInfo = `${cn} | Tracking: ${tn} | Est: ${ed}`;
    } else if (status === "delivered") {
      whatsappMsg = deliveredWA(customerName, orderNumber);
    } else {
      whatsappMsg = cancelledWA(customerName, orderNumber);
    }

    // Step 4: Send all in parallel
    const [waResult, emailResult, ownerResult] = await Promise.allSettled([
      customerPhone
        ? sendWhatsAppMessage(customerPhone, whatsappMsg)
        : Promise.resolve(false),

      sendStatusUpdateEmail(
        customerEmail,
        customerName,
        orderNumber,
        status as "shipped" | "delivered" | "cancelled",
        trackingNumber,
        courierName,
        courierTrackingUrl,
        estimatedDays,
        // New order detail fields
        orderItems,
        subtotal,
        shippingCost,
        totalAmount,
        shippingAddress,
        paymentMethod,
        customerCountry,
      ),

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
      waResult.status === "fulfilled" && waResult.value === true;
    const customerEmailSent =
      emailResult.status === "fulfilled" && emailResult.value === true;
    const ownerEmailSent =
      ownerResult.status === "fulfilled" && ownerResult.value === true;

    console.log(`Notifications [${orderNumber}] ${status}:`, {
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
