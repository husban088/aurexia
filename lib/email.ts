// lib/email.ts
// ✅ COMPLETE FIX — Yahoo + Hotmail + Outlook + Gmail + info@ — SABKA INBOX
// Spam problem fix:
//   1. List-Unsubscribe header add kiya — Yahoo/Outlook require karta hai
//   2. Reply-To header add kiya
//   3. Text version bhi bhejte hain (html only = spam flag)
//   4. Subject mein emojis kam kiye (spam trigger hote hain)
//   5. Proper headers: X-Mailer, X-Priority
//   6. From name clean rakha

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

// ─── Helper: Send via Resend with anti-spam headers ────────────────────────────
// Fix log:
//   v2 — Yahoo/Hotmail/Outlook inbox fix:
//   1. List-Unsubscribe mailto-only (URL version causes spam flag on Yahoo/Hotmail)
//   2. X-Entity-Ref-ID added (unique message ID — prevents duplicate filtering)
//   3. X-Report-Abuse added (Yahoo requires this for inbox delivery)
//   4. Precedence: bulk removed (was causing spam classification)
//   5. Message-ID header added (proper RFC 5322 compliance)
async function sendViaResend(payload: {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY missing — .env.local mein add karo");
    return false;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tech4ru.com";

  // Unique message ID — Yahoo/Outlook duplicate detection ke liye
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // ✅ Verified domain — DKIM + SPF + DMARC sab sign hoga
        from: "Tech4U Orders <orders@tech4ru.com>",

        // ✅ Reply-To — actual business email
        reply_to: "info@tech4ru.com",

        to: payload.to,
        subject: payload.subject,

        // ✅ DONO versions — HTML-only emails Yahoo/Outlook spam karte hain
        html: payload.html,
        text: payload.text,

        // ✅ Critical anti-spam headers
        headers: {
          // ── Unsubscribe ──────────────────────────────────────────────────
          // Yahoo Mail REQUIRES mailto: format — URL-only causes spam
          // One-Click unsubscribe = Gmail + Outlook tabs mein "unsubscribe" button
          "List-Unsubscribe": `<mailto:info@tech4ru.com?subject=unsubscribe-${uniqueId}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",

          // ── Message Identity ─────────────────────────────────────────────
          // RFC 5322 compliant Message-ID — missing hone pe spam flag
          "Message-ID": `<${uniqueId}@tech4ru.com>`,

          // Yahoo Mail ke liye — unique entity reference
          "X-Entity-Ref-ID": uniqueId,

          // ── Abuse Reporting ──────────────────────────────────────────────
          // Yahoo INBOX ke liye yeh header zaroori hai
          "X-Report-Abuse": `Please report abuse to: info@tech4ru.com`,

          // ── Email Classification ─────────────────────────────────────────
          // "transactional" = order confirmation, shipping updates
          // Ye batata hai ke yeh marketing nahi, genuine transactional email hai
          "X-Mailer": "Tech4U-Transactional/2.0",

          // Normal priority — 1 (high) spam trigger hota hai
          "X-Priority": "3",
          Importance: "Normal",

          // ── Gmail Deliverability ─────────────────────────────────────────
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
// Gmail ✅ | Yahoo ✅ | Hotmail ✅ | Outlook ✅ | info@ ✅
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tech4ru.com";

  // ─── Items HTML ─────────────────────────────────────────────────────────────
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

  // ─── Items Plain Text ────────────────────────────────────────────────────────
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

  // ─── HTML Email ──────────────────────────────────────────────────────────────
  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Order Confirmed - Tech4U</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Segoe UI',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:36px 32px;text-align:center;">
              <h1 style="color:#daa520;margin:0;font-size:28px;letter-spacing:3px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">TECH4U</h1>
              <p style="color:#aaaaaa;margin:6px 0 0;font-size:13px;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">tech4ru.com</p>
            </td>
          </tr>

          <!-- Success Banner -->
          <tr>
            <td style="background:#f0fdf4;padding:28px 32px;text-align:center;border-bottom:2px solid #dcfce7;">
              <div style="display:inline-block;width:52px;height:52px;background:#22c55e;border-radius:50%;text-align:center;line-height:52px;font-size:22px;margin-bottom:14px;">&#10003;</div>
              <h2 style="color:#166534;margin:0;font-size:22px;font-family:'Segoe UI',Arial,sans-serif;">Order Confirmed!</h2>
              <p style="color:#15803d;margin:8px 0 0;font-size:15px;font-family:'Segoe UI',Arial,sans-serif;">Thank you, <strong>${customerName}</strong>! Your order has been placed successfully.</p>
            </td>
          </tr>

          <!-- Order Info Cards -->
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid #f0f0f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="padding:4px;">
                    <div style="background:#fafafa;border-radius:8px;padding:16px;">
                      <p style="color:#888;margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Order Number</p>
                      <p style="color:#1a1a1a;margin:0;font-size:15px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">${orderNumber}</p>
                    </div>
                  </td>
                  <td width="33%" style="padding:4px;">
                    <div style="background:#fafafa;border-radius:8px;padding:16px;">
                      <p style="color:#888;margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Total Amount</p>
                      <p style="color:#daa520;margin:0;font-size:15px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">${displayTotal}</p>
                    </div>
                  </td>
                  <td width="33%" style="padding:4px;">
                    <div style="background:#fafafa;border-radius:8px;padding:16px;">
                      <p style="color:#888;margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Payment</p>
                      <p style="color:#1a1a1a;margin:0;font-size:13px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">${paymentMethod}</p>
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
                    <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;font-family:'Segoe UI',Arial,sans-serif;">Product</th>
                    <th style="padding:10px 16px;text-align:center;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;font-family:'Segoe UI',Arial,sans-serif;">Qty</th>
                    <th style="padding:10px 16px;text-align:right;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;font-family:'Segoe UI',Arial,sans-serif;">Price</th>
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
                <p style="color:#22c55e;margin:8px 0 0;font-size:13px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">FREE Shipping</p>
              </div>
            </td>
          </tr>

          <!-- Track Order Button -->
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <a href="${appUrl}/track-order" style="display:inline-block;background:#daa520;color:#1a1a1a;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.5px;font-family:'Segoe UI',Arial,sans-serif;">Track Your Order</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;padding:24px 32px;text-align:center;">
              <p style="color:#daa520;margin:0 0 6px;font-size:14px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Questions? We are here to help!</p>
              <p style="color:#888;margin:0 0 12px;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">info@tech4ru.com | tech4ru.com</p>
              <p style="color:#555;margin:0;font-size:11px;font-family:'Segoe UI',Arial,sans-serif;">You received this email because you placed an order on Tech4U. If this was not you, please contact us immediately.</p>
              <p style="color:#444;margin:10px 0 0;font-size:11px;font-family:'Segoe UI',Arial,sans-serif;">
                <a href="${appUrl}/unsubscribe" style="color:#666;text-decoration:underline;">Unsubscribe</a>
                &nbsp;|&nbsp;
                <a href="${appUrl}/privacy" style="color:#666;text-decoration:underline;">Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // ─── Plain Text Version (Yahoo/Outlook ke liye zaroori) ─────────────────────
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

TRACK YOUR ORDER
----------------
${appUrl}/track-order

Questions? Contact us:
Email : info@tech4ru.com
Web   : tech4ru.com

You received this email because you placed an order on Tech4U.
To unsubscribe: ${appUrl}/unsubscribe
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
// Gmail ✅ | Yahoo ✅ | Hotmail ✅ | Outlook ✅
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
  // ✅ Owner emails — comma separated from env
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
            <td style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);padding:24px 32px;">
              <h1 style="color:#fff;margin:0;font-size:20px;font-family:'Segoe UI',Arial,sans-serif;">New Order Received</h1>
              <p style="color:#fca5a5;margin:6px 0 0;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Tech4U Admin Alert - ${now} PKT</p>
            </td>
          </tr>

          <!-- Order Summary -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #f0f0f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;color:#888;font-size:13px;width:40%;font-family:'Segoe UI',Arial,sans-serif;">Order Number</td>
                  <td style="padding:8px 0;color:#1a1a1a;font-weight:700;font-size:15px;font-family:'Segoe UI',Arial,sans-serif;">${orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Total Amount</td>
                  <td style="padding:8px 0;color:#dc2626;font-weight:700;font-size:16px;font-family:'Segoe UI',Arial,sans-serif;">${displayTotal}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Payment Method</td>
                  <td style="padding:8px 0;color:#1a1a1a;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${paymentMethod}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Currency</td>
                  <td style="padding:8px 0;color:#1a1a1a;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${currencyCode}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Info -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #f0f0f0;background:#fafafa;">
              <p style="color:#1a1a1a;margin:0 0 14px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Customer Details</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#888;font-size:13px;width:35%;font-family:'Segoe UI',Arial,sans-serif;">Name</td>
                  <td style="padding:6px 0;color:#1a1a1a;font-weight:600;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Email</td>
                  <td style="padding:6px 0;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;"><a href="mailto:${customerEmail}" style="color:#2563eb;text-decoration:none;">${customerEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Phone / WhatsApp</td>
                  <td style="padding:6px 0;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;"><a href="https://wa.me/${customerPhone.replace(/\D/g, "")}" style="color:#16a34a;font-weight:600;text-decoration:none;">${customerPhone}</a></td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#888;font-size:13px;vertical-align:top;font-family:'Segoe UI',Arial,sans-serif;">Shipping Address</td>
                  <td style="padding:6px 0;color:#1a1a1a;font-size:14px;line-height:1.5;font-family:'Segoe UI',Arial,sans-serif;">${shippingAddress}</td>
                </tr>
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

          <!-- Admin Panel Link -->
          <tr>
            <td style="padding:20px 32px;text-align:center;">
              <a href="${appUrl}/panel" style="display:inline-block;background:#1a1a1a;color:#daa520;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">Open Admin Panel</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;padding:20px 32px;text-align:center;">
              <p style="color:#888;margin:0;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">Tech4U Admin Alert | tech4ru.com</p>
              <p style="color:#444;margin:8px 0 0;font-size:11px;font-family:'Segoe UI',Arial,sans-serif;">
                <a href="${appUrl}/unsubscribe" style="color:#666;text-decoration:underline;">Unsubscribe</a>
              </p>
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

// ============================================
// STATUS UPDATE EMAIL — Shipped / Delivered / Cancelled
// Customer ko status change par email jayegi
// Gmail ✅ | Yahoo ✅ | Hotmail ✅ | Outlook ✅
// ============================================
export async function sendStatusUpdateEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  newStatus: "shipped" | "delivered" | "cancelled" | "confirmed" | "processing",
  trackingNumber?: string,
  courierName?: string,
  courierTrackingUrl?: string,
  estimatedDays?: string,
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tech4ru.com";

  const statusConfig = {
    confirmed: {
      emoji: "✓",
      title: "Order Confirmed",
      color: "#2563eb",
      bgColor: "#eff6ff",
      borderColor: "#bfdbfe",
      titleColor: "#1e40af",
      message: `Your order <strong>${orderNumber}</strong> has been confirmed and is being prepared.`,
      textMessage: `Your order ${orderNumber} has been confirmed and is being prepared.`,
    },
    processing: {
      emoji: "⚙",
      title: "Order Processing",
      color: "#7c3aed",
      bgColor: "#f5f3ff",
      borderColor: "#ddd6fe",
      titleColor: "#5b21b6",
      message: `Your order <strong>${orderNumber}</strong> is currently being processed.`,
      textMessage: `Your order ${orderNumber} is currently being processed.`,
    },
    shipped: {
      emoji: "→",
      title: "Order Shipped",
      color: "#0891b2",
      bgColor: "#ecfeff",
      borderColor: "#a5f3fc",
      titleColor: "#164e63",
      message: `Great news! Your order <strong>${orderNumber}</strong> has been shipped and is on its way.`,
      textMessage: `Great news! Your order ${orderNumber} has been shipped and is on its way.`,
    },
    delivered: {
      emoji: "✓",
      title: "Order Delivered",
      color: "#16a34a",
      bgColor: "#f0fdf4",
      borderColor: "#bbf7d0",
      titleColor: "#166534",
      message: `Your order <strong>${orderNumber}</strong> has been delivered successfully. We hope you love it!`,
      textMessage: `Your order ${orderNumber} has been delivered successfully. We hope you love it!`,
    },
    cancelled: {
      emoji: "✕",
      title: "Order Cancelled",
      color: "#dc2626",
      bgColor: "#fef2f2",
      borderColor: "#fecaca",
      titleColor: "#991b1b",
      message: `Your order <strong>${orderNumber}</strong> has been cancelled. If you have questions, please contact us.`,
      textMessage: `Your order ${orderNumber} has been cancelled. If you have questions, please contact us.`,
    },
  };

  const cfg = statusConfig[newStatus];

  const shippingHTML =
    newStatus === "shipped" && (trackingNumber || courierName)
      ? `
      <tr>
        <td style="padding:20px 32px;border-bottom:1px solid #f0f0f0;">
          <div style="background:#f8fafc;border-radius:8px;padding:20px;">
            <p style="color:#1a1a1a;margin:0 0 14px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Shipping Details</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${courierName ? `<tr><td style="padding:6px 0;color:#888;font-size:13px;width:40%;font-family:'Segoe UI',Arial,sans-serif;">Courier</td><td style="padding:6px 0;color:#1a1a1a;font-size:14px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">${courierName}</td></tr>` : ""}
              ${trackingNumber ? `<tr><td style="padding:6px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Tracking Number</td><td style="padding:6px 0;color:#1a1a1a;font-size:14px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">${trackingNumber}</td></tr>` : ""}
              ${estimatedDays ? `<tr><td style="padding:6px 0;color:#888;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Estimated Delivery</td><td style="padding:6px 0;color:#1a1a1a;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">${estimatedDays}</td></tr>` : ""}
            </table>
            ${
              courierTrackingUrl
                ? `<a href="${courierTrackingUrl}" style="display:inline-block;margin-top:14px;background:${cfg.color};color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Track Package</a>`
                : ""
            }
          </div>
        </td>
      </tr>`
      : "";

  const shippingText =
    newStatus === "shipped" && (trackingNumber || courierName)
      ? `
SHIPPING DETAILS
----------------
${courierName ? `Courier        : ${courierName}` : ""}
${trackingNumber ? `Tracking Number: ${trackingNumber}` : ""}
${estimatedDays ? `Est. Delivery  : ${estimatedDays}` : ""}
${courierTrackingUrl ? `Track Package  : ${courierTrackingUrl}` : ""}
`
      : "";

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${cfg.title} - Tech4U</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:32px;text-align:center;">
              <h1 style="color:#daa520;margin:0;font-size:26px;letter-spacing:3px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">TECH4U</h1>
              <p style="color:#aaa;margin:6px 0 0;font-size:12px;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">tech4ru.com</p>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="background:${cfg.bgColor};padding:28px 32px;text-align:center;border-bottom:2px solid ${cfg.borderColor};">
              <div style="display:inline-block;width:52px;height:52px;background:${cfg.color};border-radius:50%;text-align:center;line-height:52px;color:#fff;font-size:22px;font-weight:700;margin-bottom:14px;font-family:'Segoe UI',Arial,sans-serif;">${cfg.emoji}</div>
              <h2 style="color:${cfg.titleColor};margin:0;font-size:22px;font-family:'Segoe UI',Arial,sans-serif;">${cfg.title}!</h2>
              <p style="color:${cfg.titleColor};margin:10px 0 0;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">Hello <strong>${customerName}</strong>, ${cfg.message}</p>
            </td>
          </tr>

          <!-- Order Number -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #f0f0f0;">
              <div style="background:#fafafa;border-radius:8px;padding:16px;text-align:center;">
                <p style="color:#888;margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">Order Number</p>
                <p style="color:#1a1a1a;margin:0;font-size:20px;font-weight:700;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">${orderNumber}</p>
              </div>
            </td>
          </tr>

          ${shippingHTML}

          <!-- Track Button -->
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <a href="${appUrl}/track-order" style="display:inline-block;background:#daa520;color:#1a1a1a;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">Track Your Order</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;padding:24px 32px;text-align:center;">
              <p style="color:#daa520;margin:0 0 6px;font-size:13px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Questions? Contact us anytime</p>
              <p style="color:#888;margin:0 0 12px;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;">info@tech4ru.com | tech4ru.com</p>
              <p style="color:#444;margin:0;font-size:11px;font-family:'Segoe UI',Arial,sans-serif;">
                <a href="${appUrl}/unsubscribe" style="color:#666;text-decoration:underline;">Unsubscribe</a>
                &nbsp;|&nbsp;
                <a href="${appUrl}/privacy" style="color:#666;text-decoration:underline;">Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textBody = `${cfg.title} - Tech4U
========================

Hello ${customerName},

${cfg.textMessage}

Order Number: ${orderNumber}
${shippingText}
Track your order: ${appUrl}/track-order

Questions? Contact us:
Email : info@tech4ru.com
Web   : tech4ru.com

To unsubscribe: ${appUrl}/unsubscribe
`;

  const subjectMap = {
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
