// lib/email.ts
// ✅ FINAL FIX — Yahoo + Hotmail + Outlook + Gmail — DIRECT INBOX
// Fixes applied:
//   1. ALL <a href> links REMOVED from customer emails (Yahoo/Hotmail main spam reason)
//   2. Track Order button REMOVED (link = spam flag)
//   3. Unsubscribe/Privacy links REMOVED from HTML (mailto only)
//   4. Owner email links kept (owner Gmail pe jaata hai — okay)
//   5. List-Unsubscribe mailto only — no URL
//   6. Both HTML + Text versions
//   7. Proper anti-spam headers

interface OrderItem {
  name: string;
  variant?: string | null;
  quantity: number;
  price: number;
  piecesPerUnit?: number;
}

interface FormattedItem {
  name: string;
  variant?: string | null;
  quantity: number;
  formattedPrice: string;
}

// ─── Helper: Send via Resend ────────────────────────────────────────────────
async function sendViaResend(payload: {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY missing");
    return false;
  }

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

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
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        headers: {
          // Yahoo REQUIRES mailto: only — no URL
          "List-Unsubscribe": `<mailto:info@tech4ru.com?subject=unsubscribe-${uniqueId}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "Message-ID": `<${uniqueId}@tech4ru.com>`,
          "X-Entity-Ref-ID": uniqueId,
          "X-Report-Abuse": "Please report abuse to: info@tech4ru.com",
          "X-Mailer": "Tech4U-Transactional/2.0",
          "X-Priority": "3",
          Importance: "Normal",
          "Feedback-ID": `orders:tech4ru:resend`,
        },
      }),
    });

    const result = await response.json();
    if (response.ok && result.id) {
      console.log(`✅ Email sent! ID: ${result.id} → ${payload.to.join(", ")}`);
      return true;
    } else {
      console.error(`❌ Email failed:`, JSON.stringify(result));
      return false;
    }
  } catch (error) {
    console.error(`❌ Email fetch error:`, error);
    return false;
  }
}

// ============================================
// CUSTOMER EMAIL — Order Confirmation
// ✅ NO LINKS — Yahoo/Hotmail inbox safe
// ============================================
export async function sendOrderConfirmationEmail(
  customerEmail: string,
  orderNumber: string,
  customerName: string,
  items: OrderItem[],
  total: number,
  shippingAddress: string,
  paymentMethod: string,
  currencyCode: string = "PKR",
  formattedTotal?: string,
  formattedItems?: FormattedItem[],
): Promise<boolean> {
  const displayTotal = formattedTotal || `PKR ${total.toLocaleString()}`;

  const itemsHTML =
    formattedItems && formattedItems.length > 0
      ? formattedItems
          .map(
            (item) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-family:'Segoe UI',Arial,sans-serif;">
            <strong style="color:#1a1a1a;font-size:14px;">${item.name}</strong>
            ${item.variant ? `<br><span style="color:#888;font-size:12px;">${item.variant}</span>` : ""}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:center;color:#555;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">x${item.quantity}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:right;color:#1a1a1a;font-weight:700;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${item.formattedPrice}</td>
        </tr>`,
          )
          .join("")
      : items
          .map(
            (item) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-family:'Segoe UI',Arial,sans-serif;">
            <strong style="color:#1a1a1a;font-size:14px;">${item.name}</strong>
            ${item.variant ? `<br><span style="color:#888;font-size:12px;">${item.variant}</span>` : ""}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:center;color:#555;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">x${item.quantity}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:right;color:#1a1a1a;font-weight:700;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">PKR ${item.price.toLocaleString()}</td>
        </tr>`,
          )
          .join("");

  const itemsText =
    formattedItems && formattedItems.length > 0
      ? formattedItems
          .map(
            (item) =>
              `- ${item.name}${item.variant ? ` (${item.variant})` : ""} x${item.quantity}: ${item.formattedPrice}`,
          )
          .join("\n")
      : items
          .map(
            (item) =>
              `- ${item.name}${item.variant ? ` (${item.variant})` : ""} x${item.quantity}: PKR ${item.price.toLocaleString()}`,
          )
          .join("\n");

  // ✅ NO <a href> links anywhere in customer HTML
  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Order Confirmed - Tech4U</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:36px 32px;text-align:center;">
              <p style="color:#daa520;margin:0;font-size:28px;letter-spacing:3px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">TECH4U</p>
              <p style="color:#aaaaaa;margin:6px 0 0;font-size:13px;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">tech4ru.com</p>
            </td>
          </tr>

          <!-- Success Banner -->
          <tr>
            <td style="background:#f0fdf4;padding:28px 32px;text-align:center;border-bottom:2px solid #dcfce7;">
              <div style="display:inline-block;width:52px;height:52px;background:#22c55e;border-radius:50%;text-align:center;line-height:52px;font-size:22px;color:#fff;margin-bottom:14px;font-weight:700;">&#10003;</div>
              <p style="color:#166534;margin:0;font-size:22px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">Order Confirmed!</p>
              <p style="color:#15803d;margin:8px 0 0;font-size:15px;font-family:'Segoe UI',Arial,sans-serif;">Thank you, <strong>${customerName}</strong>! Your order has been placed successfully.</p>
            </td>
          </tr>

          <!-- Order Info -->
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid #f0f0f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding:4px;">
                    <div style="background:#fafafa;border-radius:8px;padding:16px;">
                      <p style="color:#888;margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Order Number</p>
                      <p style="color:#1a1a1a;margin:0;font-size:15px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">${orderNumber}</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:4px;">
                    <div style="background:#fafafa;border-radius:8px;padding:16px;">
                      <p style="color:#888;margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Total Amount</p>
                      <p style="color:#daa520;margin:0;font-size:15px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">${displayTotal}</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:4px;">
                    <div style="background:#fafafa;border-radius:8px;padding:16px;">
                      <p style="color:#888;margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Payment</p>
                      <p style="color:#1a1a1a;margin:0;font-size:13px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">${paymentMethod}</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:4px;">
                    <div style="background:#fafafa;border-radius:8px;padding:16px;">
                      <p style="color:#888;margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Shipping</p>
                      <p style="color:#22c55e;margin:0;font-size:13px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">FREE</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid #f0f0f0;">
              <p style="color:#1a1a1a;margin:0 0 14px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Items Ordered</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;">
                <thead>
                  <tr style="background:#fafafa;">
                    <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Product</th>
                    <th style="padding:10px 16px;text-align:center;font-size:12px;color:#888;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Qty</th>
                    <th style="padding:10px 16px;text-align:right;font-size:12px;color:#888;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                  <tr style="background:#fafafa;">
                    <td colspan="2" style="padding:14px 16px;font-weight:700;color:#1a1a1a;font-size:15px;font-family:'Segoe UI',Arial,sans-serif;">Total</td>
                    <td style="padding:14px 16px;text-align:right;font-weight:700;color:#daa520;font-size:16px;font-family:'Segoe UI',Arial,sans-serif;">${displayTotal}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding:20px 32px 28px;">
              <div style="background:#fafafa;border-radius:8px;padding:20px;">
                <p style="color:#1a1a1a;margin:0 0 8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Shipping To</p>
                <p style="color:#555;margin:0;font-size:14px;line-height:1.6;font-family:'Segoe UI',Arial,sans-serif;">${shippingAddress}</p>
              </div>
            </td>
          </tr>

          <!-- Contact — NO links, plain text only -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center;">
              <p style="color:#888;margin:0 0 4px;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Questions? Email us: info@tech4ru.com</p>
              <p style="color:#aaa;margin:0;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">Visit: tech4ru.com</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;padding:20px 32px;text-align:center;">
              <p style="color:#555;margin:0;font-size:11px;font-family:'Segoe UI',Arial,sans-serif;">You received this because you placed an order at Tech4U. To unsubscribe reply with subject: unsubscribe</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textBody = `Order Confirmed - Tech4U
========================

Hello ${customerName},

Your order has been placed successfully!

ORDER DETAILS
-------------
Order Number : ${orderNumber}
Total Amount : ${displayTotal}
Payment      : ${paymentMethod}

ITEMS ORDERED
-------------
${itemsText}

Total: ${displayTotal}

SHIPPING TO
-----------
${shippingAddress}
Shipping: FREE

Questions? Contact us:
Email : info@tech4ru.com
Web   : tech4ru.com

You received this email because you placed an order on Tech4U.
To unsubscribe reply with subject: unsubscribe
`;

  return sendViaResend({
    to: [customerEmail],
    subject: `Order Confirmed - ${orderNumber} | Tech4U`,
    html: htmlBody,
    text: textBody,
  });
}

// ============================================
// OWNER EMAIL — New Order Alert
// Links okay here — owner Gmail pe jaata hai
// ============================================
export async function sendOwnerOrderAlert(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  items: OrderItem[],
  total: number,
  shippingAddress: string,
  paymentMethod: string,
  currencyCode: string = "PKR",
  formattedTotal?: string,
  formattedItems?: FormattedItem[],
): Promise<boolean> {
  const ownerEmails = (
    process.env.OWNER_EMAILS ||
    process.env.OWNER_EMAIL ||
    "tech4ruu@gmail.com"
  )
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const displayTotal = formattedTotal || `PKR ${total.toLocaleString()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tech4ru.com";
  const now = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });

  const itemsText =
    formattedItems && formattedItems.length > 0
      ? formattedItems
          .map(
            (item) =>
              `- ${item.name}${item.variant ? ` (${item.variant})` : ""} x${item.quantity}: ${item.formattedPrice}`,
          )
          .join("\n")
      : items
          .map(
            (item) =>
              `- ${item.name}${item.variant ? ` (${item.variant})` : ""} x${item.quantity}: PKR ${item.price.toLocaleString()}`,
          )
          .join("\n");

  const itemsHTML =
    formattedItems && formattedItems.length > 0
      ? formattedItems
          .map(
            (item) => `
          <tr>
            <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${item.name}${item.variant ? `<br><span style="color:#888;font-size:12px;">${item.variant}</span>` : ""}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">x${item.quantity}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${item.formattedPrice}</td>
          </tr>`,
          )
          .join("")
      : items
          .map(
            (item) => `
          <tr>
            <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${item.name}${item.variant ? `<br><span style="color:#888;font-size:12px;">${item.variant}</span>` : ""}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">x${item.quantity}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">PKR ${item.price.toLocaleString()}</td>
          </tr>`,
          )
          .join("");

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>New Order Alert - Tech4U</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#dc2626;padding:24px 32px;">
              <p style="color:#fff;margin:0;font-size:20px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">New Order Received</p>
              <p style="color:#fca5a5;margin:6px 0 0;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Tech4U Admin Alert - ${now} PKT</p>
            </td>
          </tr>

          <!-- Order Summary -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #f0f0f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;color:#888;font-size:13px;width:40%;font-family:'Segoe UI',Arial,sans-serif;">Order Number</td><td style="padding:8px 0;color:#1a1a1a;font-weight:700;font-size:15px;font-family:'Segoe UI',Arial,sans-serif;">${orderNumber}</td></tr>
                <tr><td style="padding:8px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Total Amount</td><td style="padding:8px 0;color:#dc2626;font-weight:700;font-size:16px;font-family:'Segoe UI',Arial,sans-serif;">${displayTotal}</td></tr>
                <tr><td style="padding:8px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Payment Method</td><td style="padding:8px 0;color:#1a1a1a;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${paymentMethod}</td></tr>
                <tr><td style="padding:8px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Currency</td><td style="padding:8px 0;color:#1a1a1a;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${currencyCode}</td></tr>
              </table>
            </td>
          </tr>

          <!-- Customer Info -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #f0f0f0;background:#fafafa;">
              <p style="color:#1a1a1a;margin:0 0 14px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Customer Details</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;color:#888;font-size:13px;width:35%;font-family:'Segoe UI',Arial,sans-serif;">Name</td><td style="padding:6px 0;color:#1a1a1a;font-weight:600;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${customerName}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Email</td><td style="padding:6px 0;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${customerEmail}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Phone</td><td style="padding:6px 0;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${customerPhone}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:13px;vertical-align:top;font-family:'Segoe UI',Arial,sans-serif;">Shipping Address</td><td style="padding:6px 0;color:#1a1a1a;font-size:14px;line-height:1.5;font-family:'Segoe UI',Arial,sans-serif;">${shippingAddress}</td></tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #f0f0f0;">
              <p style="color:#1a1a1a;margin:0 0 14px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Items Ordered</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;">
                <thead>
                  <tr style="background:#fafafa;">
                    <th style="padding:10px 14px;text-align:left;font-size:12px;color:#888;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Product</th>
                    <th style="padding:10px 14px;text-align:center;font-size:12px;color:#888;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Qty</th>
                    <th style="padding:10px 14px;text-align:right;font-size:12px;color:#888;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                  <tr style="background:#fff3f3;">
                    <td colspan="2" style="padding:12px 14px;font-weight:700;color:#1a1a1a;font-size:15px;font-family:'Segoe UI',Arial,sans-serif;">TOTAL</td>
                    <td style="padding:12px 14px;text-align:right;font-weight:700;color:#dc2626;font-size:16px;font-family:'Segoe UI',Arial,sans-serif;">${displayTotal}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Admin Panel — text only, no button link -->
          <tr>
            <td style="padding:20px 32px;text-align:center;">
              <p style="color:#888;margin:0;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Admin Panel: ${appUrl}/panel</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;padding:20px 32px;text-align:center;">
              <p style="color:#888;margin:0;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">Tech4U Admin Alert | tech4ru.com</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textBody = `NEW ORDER RECEIVED - Tech4U
============================
Time: ${now} PKT

ORDER DETAILS
-------------
Order Number : ${orderNumber}
Total Amount : ${displayTotal}
Payment      : ${paymentMethod}
Currency     : ${currencyCode}

CUSTOMER DETAILS
----------------
Name    : ${customerName}
Email   : ${customerEmail}
Phone   : ${customerPhone}
Address : ${shippingAddress}

ITEMS ORDERED
-------------
${itemsText}

Total: ${displayTotal}

Admin Panel: ${appUrl}/panel
`;

  return sendViaResend({
    to: ownerEmails,
    subject: `New Order ${orderNumber} - ${displayTotal} | Tech4U`,
    html: htmlBody,
    text: textBody,
  });
}

// ============================================================
// STATUS UPDATE EMAIL — Shipped / Delivered / Cancelled
// ✅ ZERO links — Yahoo/Hotmail direct inbox
// ============================================================

function convertCurrency(
  pkrAmount: number,
  country: string,
): { amount: string; currency: string; symbol: string } {
  const c = country.toLowerCase();
  if (
    c.includes("united kingdom") ||
    c.includes("uk") ||
    c.includes("britain")
  ) {
    const gbp = pkrAmount / 356;
    return { amount: gbp.toFixed(2), currency: "GBP", symbol: "£" };
  }
  if (c.includes("australia")) {
    const aud = pkrAmount / 181;
    return { amount: aud.toFixed(2), currency: "AUD", symbol: "A$" };
  }
  if (c.includes("united states") || c.includes("usa") || c.includes("us")) {
    const usd = pkrAmount / 278;
    return { amount: usd.toFixed(2), currency: "USD", symbol: "$" };
  }
  if (c.includes("canada")) {
    const cad = pkrAmount / 205;
    return { amount: cad.toFixed(2), currency: "CAD", symbol: "C$" };
  }
  if (c.includes("emirates") || c.includes("uae") || c.includes("dubai")) {
    const aed = pkrAmount / 75.7;
    return { amount: aed.toFixed(2), currency: "AED", symbol: "AED " };
  }
  const pkr = Math.round(pkrAmount).toLocaleString("en-PK");
  return { amount: pkr, currency: "PKR", symbol: "PKR " };
}

function formatMoney(pkrAmount: number, country: string): string {
  const { symbol, amount } = convertCurrency(pkrAmount, country);
  return `${symbol}${amount}`;
}

interface StatusEmailItem {
  product_name?: string;
  variant_name?: string;
  variant_image?: string;
  quantity: number;
  price: number;
  pieces_per_unit?: number;
}

export async function sendStatusUpdateEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  newStatus: "shipped" | "delivered" | "cancelled" | "confirmed" | "processing",
  trackingNumber?: string,
  courierName?: string,
  courierTrackingUrl?: string,
  estimatedDays?: string,
  orderItems?: StatusEmailItem[],
  subtotal?: number,
  shippingCost?: number,
  totalAmount?: number,
  shippingAddress?: string,
  paymentMethod?: string,
  customerCountry?: string,
): Promise<boolean> {
  const country = customerCountry || "Pakistan";

  const statusConfig = {
    confirmed: {
      title: "Order Confirmed",
      color: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
      textColor: "#1e40af",
      icon: "&#10003;",
      headline: `Your order has been confirmed and is being prepared.`,
    },
    processing: {
      title: "Order Processing",
      color: "#7c3aed",
      bg: "#f5f3ff",
      border: "#ddd6fe",
      textColor: "#5b21b6",
      icon: "&#9881;",
      headline: `Your order is currently being processed by our team.`,
    },
    shipped: {
      title: "Order Shipped",
      color: "#0891b2",
      bg: "#ecfeff",
      border: "#a5f3fc",
      textColor: "#164e63",
      icon: "&#10132;",
      headline: `Great news! Your order has been shipped and is on its way.`,
    },
    delivered: {
      title: "Order Delivered",
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      textColor: "#166534",
      icon: "&#10003;",
      headline: `Your order has been delivered! We hope you love your purchase.`,
    },
    cancelled: {
      title: "Order Cancelled",
      color: "#dc2626",
      bg: "#fef2f2",
      border: "#fecaca",
      textColor: "#991b1b",
      icon: "&#10005;",
      headline: `Your order has been cancelled. Contact us if you have questions.`,
    },
  };

  const cfg = statusConfig[newStatus];

  function buildItemsHTML(items: StatusEmailItem[]): string {
    if (!items || items.length === 0) return "";
    return items
      .map((item) => {
        const ppu = item.pieces_per_unit ?? 1;
        const lineTotal = item.price * ppu * item.quantity;
        // ✅ NO <img src> from external URLs — spam trigger on Yahoo
        // Use placeholder div instead
        const imgTag = `<div style="width:48px;height:48px;background:#f0f0f0;border-radius:6px;display:inline-block;vertical-align:middle;text-align:center;line-height:48px;color:#aaa;font-size:18px;">&#128722;</div>`;
        return `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f5f5f5;vertical-align:middle;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:10px;vertical-align:middle;">${imgTag}</td>
              <td style="vertical-align:middle;">
                <div style="color:#1a1a1a;font-size:13px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">${item.product_name || "Product"}</div>
                ${item.variant_name && item.variant_name !== "Standard" ? `<div style="color:#888;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">${item.variant_name}</div>` : ""}
                ${ppu > 1 ? `<div style="color:#aaa;font-size:11px;font-family:'Segoe UI',Arial,sans-serif;">${ppu} pcs/unit</div>` : ""}
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #f5f5f5;text-align:center;color:#555;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;vertical-align:middle;">x${item.quantity}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f5f5f5;text-align:right;color:#1a1a1a;font-weight:700;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;vertical-align:middle;">${formatMoney(lineTotal, country)}</td>
      </tr>`;
      })
      .join("");
  }

  function buildItemsText(items: StatusEmailItem[]): string {
    if (!items || items.length === 0) return "";
    return items
      .map((item) => {
        const ppu = item.pieces_per_unit ?? 1;
        const lineTotal = item.price * ppu * item.quantity;
        return `- ${item.product_name || "Product"}${item.variant_name && item.variant_name !== "Standard" ? ` (${item.variant_name})` : ""} x${item.quantity}: ${formatMoney(lineTotal, country)}`;
      })
      .join("\n");
  }

  // ── Shipped section — NO tracking URL link, plain text only ─────────────────
  const shippedInfoHTML =
    newStatus === "shipped"
      ? `
      <tr>
        <td style="padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;">
            <tr><td style="padding:16px 20px;">
              <p style="color:#1a1a1a;margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Shipping Details</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${courierName ? `<tr><td style="padding:4px 0;color:#888;font-size:13px;width:45%;font-family:'Segoe UI',Arial,sans-serif;">Courier</td><td style="padding:4px 0;color:#1a1a1a;font-size:13px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">${courierName}</td></tr>` : ""}
                ${trackingNumber ? `<tr><td style="padding:4px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Tracking Number</td><td style="padding:4px 0;color:#1a1a1a;font-size:13px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">${trackingNumber}</td></tr>` : ""}
                ${estimatedDays ? `<tr><td style="padding:4px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Estimated Delivery</td><td style="padding:4px 0;color:#1a1a1a;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">${estimatedDays}</td></tr>` : ""}
              </table>
            </td></tr>
          </table>
        </td>
      </tr>`
      : "";

  // ── Delivered section — full order details ───────────────────────────────────
  const deliveredItemsHTML =
    newStatus === "delivered" && orderItems && orderItems.length > 0
      ? `
      <tr>
        <td style="padding:0 32px 20px;">
          <p style="color:#1a1a1a;margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Items Ordered</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#fafafa;">
                <th style="padding:10px 16px;text-align:left;font-size:11px;color:#888;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Product</th>
                <th style="padding:10px 16px;text-align:center;font-size:11px;color:#888;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Qty</th>
                <th style="padding:10px 16px;text-align:right;font-size:11px;color:#888;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${buildItemsHTML(orderItems)}
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:8px;">
            <tr><td style="padding:14px 16px;">
              ${subtotal !== undefined ? `<table width="100%"><tr><td style="font-size:13px;color:#888;font-family:'Segoe UI',Arial,sans-serif;">Subtotal</td><td style="text-align:right;font-size:13px;color:#888;font-family:'Segoe UI',Arial,sans-serif;">${formatMoney(subtotal, country)}</td></tr></table>` : ""}
              ${shippingCost !== undefined ? `<table width="100%"><tr><td style="font-size:13px;color:#888;font-family:'Segoe UI',Arial,sans-serif;">Shipping</td><td style="text-align:right;font-size:13px;color:#888;font-family:'Segoe UI',Arial,sans-serif;">${shippingCost === 0 ? "Free" : formatMoney(shippingCost, country)}</td></tr></table>` : ""}
              <div style="border-top:1px solid #e5e5e5;margin:8px 0;"></div>
              <table width="100%"><tr><td style="font-size:15px;font-weight:700;color:#1a1a1a;font-family:'Segoe UI',Arial,sans-serif;">Total</td><td style="text-align:right;font-size:15px;font-weight:700;color:${cfg.color};font-family:'Segoe UI',Arial,sans-serif;">${totalAmount !== undefined ? formatMoney(totalAmount, country) : ""}</td></tr></table>
            </td></tr>
          </table>
        </td>
      </tr>
      ${
        shippingAddress
          ? `
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;font-family:'Segoe UI',Arial,sans-serif;">Delivered To</p>
          <p style="color:#555;font-size:13px;line-height:1.6;margin:0;font-family:'Segoe UI',Arial,sans-serif;">${shippingAddress}</p>
        </td>
      </tr>`
          : ""
      }`
      : "";

  // ✅ NO <a href> links anywhere
  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${cfg.title} - Tech4U</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:24px 32px;text-align:center;">
              <p style="color:#daa520;margin:0;font-size:22px;letter-spacing:3px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">TECH4U</p>
              <p style="color:#888;margin:4px 0 0;font-size:11px;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">tech4ru.com</p>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="background:${cfg.bg};padding:24px 32px;text-align:center;border-bottom:2px solid ${cfg.border};">
              <div style="display:inline-block;width:48px;height:48px;background:${cfg.color};border-radius:50%;text-align:center;line-height:48px;color:#fff;font-size:20px;font-weight:700;margin-bottom:12px;font-family:'Segoe UI',Arial,sans-serif;">${cfg.icon}</div>
              <p style="color:${cfg.textColor};margin:0;font-size:20px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">${cfg.title}!</p>
              <p style="color:${cfg.textColor};margin:8px 0 0;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Hello <strong>${customerName}</strong>, ${cfg.headline}</p>
            </td>
          </tr>

          <!-- Order Number -->
          <tr>
            <td style="padding:20px 32px;border-bottom:1px solid #f0f0f0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:8px;">
                <tr><td style="padding:14px 16px;text-align:center;">
                  <p style="color:#aaa;margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Order Number</p>
                  <p style="color:#1a1a1a;margin:0;font-size:20px;font-weight:700;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">${orderNumber}</p>
                </td></tr>
              </table>
            </td>
          </tr>

          ${shippedInfoHTML}
          ${deliveredItemsHTML}

          <!-- Contact — plain text only, NO links -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
              <p style="color:#888;margin:0 0 4px;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">Questions? Email us: info@tech4ru.com</p>
              <p style="color:#aaa;margin:0;font-size:11px;font-family:'Segoe UI',Arial,sans-serif;">Tech4U — tech4ru.com</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;padding:16px 32px;text-align:center;">
              <p style="color:#555;margin:0;font-size:10px;font-family:'Segoe UI',Arial,sans-serif;">You received this because you placed an order at Tech4U. To unsubscribe reply: unsubscribe</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const shippedText =
    newStatus === "shipped"
      ? `
SHIPPING DETAILS
----------------
${courierName ? `Courier         : ${courierName}` : ""}
${trackingNumber ? `Tracking Number : ${trackingNumber}` : ""}
${estimatedDays ? `Est. Delivery   : ${estimatedDays}` : ""}
`
      : "";

  const deliveredText =
    newStatus === "delivered" && orderItems && orderItems.length > 0
      ? `
ITEMS ORDERED
-------------
${buildItemsText(orderItems)}

${subtotal !== undefined ? `Subtotal : ${formatMoney(subtotal, country)}` : ""}
${shippingCost !== undefined ? `Shipping : ${shippingCost === 0 ? "Free" : formatMoney(shippingCost, country)}` : ""}
${totalAmount !== undefined ? `Total    : ${formatMoney(totalAmount, country)}` : ""}
${shippingAddress ? `\nDelivered To: ${shippingAddress}` : ""}
`
      : "";

  const textBody = `${cfg.title} - Tech4U
========================

Hello ${customerName},

${cfg.headline}

Order Number: ${orderNumber}
${shippedText}${deliveredText}
Questions? Email: info@tech4ru.com
Website: tech4ru.com

To unsubscribe reply with subject: unsubscribe
`;

  const subjectMap: Record<string, string> = {
    confirmed: `Order Confirmed - ${orderNumber} | Tech4U`,
    processing: `Order Processing - ${orderNumber} | Tech4U`,
    shipped: `Your Order Has Shipped - ${orderNumber} | Tech4U`,
    delivered: `Order Delivered - ${orderNumber} | Tech4U`,
    cancelled: `Order Cancelled - ${orderNumber} | Tech4U`,
  };

  return sendViaResend({
    to: [customerEmail],
    subject: subjectMap[newStatus],
    html: htmlBody,
    text: textBody,
  });
}
