// lib/email-smtp.ts
// ✅ ALL emails → INBOX (same transporter + plain text + no emoji subjects)
// ✅ sendOrderConfirmationEmail — inbox-friendly, same as status emails
// ✅ Currency properly used from formattedTotal + formattedItems

import nodemailer from "nodemailer";

// ── Currency helpers ──────────────────────────────────────────────────────────
const PKR_RATES: Record<
  string,
  { symbol: string; rate: number; code: string }
> = {
  Pakistan: { symbol: "Rs.", rate: 1, code: "PKR" },
  "United States": { symbol: "$", rate: 0.0036, code: "USD" },
  USA: { symbol: "$", rate: 0.0036, code: "USD" },
  US: { symbol: "$", rate: 0.0036, code: "USD" },
  "United Kingdom": { symbol: "GBP", rate: 0.0028, code: "GBP" },
  UK: { symbol: "GBP", rate: 0.0028, code: "GBP" },
  GB: { symbol: "GBP", rate: 0.0028, code: "GBP" },
  England: { symbol: "GBP", rate: 0.0028, code: "GBP" },
  Australia: { symbol: "A$", rate: 0.0055, code: "AUD" },
  AU: { symbol: "A$", rate: 0.0055, code: "AUD" },
  Canada: { symbol: "C$", rate: 0.0049, code: "CAD" },
  CA: { symbol: "C$", rate: 0.0049, code: "CAD" },
  "United Arab Emirates": { symbol: "AED", rate: 0.013, code: "AED" },
  UAE: { symbol: "AED", rate: 0.013, code: "AED" },
  AE: { symbol: "AED", rate: 0.013, code: "AED" },
  Dubai: { symbol: "AED", rate: 0.013, code: "AED" },
  "Saudi Arabia": { symbol: "SAR", rate: 0.013, code: "SAR" },
  SA: { symbol: "SAR", rate: 0.013, code: "SAR" },
  KSA: { symbol: "SAR", rate: 0.013, code: "SAR" },
  India: { symbol: "Rs", rate: 0.3, code: "INR" },
  IN: { symbol: "Rs", rate: 0.3, code: "INR" },
  Germany: { symbol: "EUR", rate: 0.0033, code: "EUR" },
  France: { symbol: "EUR", rate: 0.0033, code: "EUR" },
  Italy: { symbol: "EUR", rate: 0.0033, code: "EUR" },
  Spain: { symbol: "EUR", rate: 0.0033, code: "EUR" },
  Netherlands: { symbol: "EUR", rate: 0.0033, code: "EUR" },
};

function getCurrencyForCountry(country: string) {
  if (!country) return PKR_RATES["Pakistan"];
  if (PKR_RATES[country]) return PKR_RATES[country];
  const lower = country.toLowerCase();
  for (const [key, val] of Object.entries(PKR_RATES)) {
    if (key.toLowerCase() === lower || lower.includes(key.toLowerCase()))
      return val;
  }
  return PKR_RATES["Pakistan"];
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORTER
// ✅ Uses explicit SMTP (not just service:"gmail") — better deliverability
// ✅ Port 587 + requireTLS — standard for transactional email
// ─────────────────────────────────────────────────────────────────────────────
function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: { rejectUnauthorized: true },
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormattedItem {
  name: string;
  variant?: string | null;
  quantity: number;
  formattedPrice: string;
  pricePKR?: number;
  image?: string | null;
  variant_image?: string | null;
  product_image?: string | null;
}

// ── Item rows HTML ────────────────────────────────────────────────────────────
function buildItemRows(items: FormattedItem[]): string {
  return items
    .map((item) => {
      const variantText =
        item.variant && item.variant !== "Standard"
          ? `<br/><span style="font-size:12px;color:#888888;">${item.variant}</span>`
          : "";
      const imageUrl =
        item.variant_image || item.image || item.product_image || null;
      const imgCell = imageUrl
        ? `<img src="${imageUrl}" alt="${item.name}" width="56" height="56" style="width:56px;height:56px;object-fit:cover;border-radius:8px;display:block;" />`
        : `<div style="width:56px;height:56px;background-color:#f5f0e8;border-radius:8px;text-align:center;line-height:56px;font-size:18px;display:block;">Box</div>`;

      return `<tr>
      <td style="padding:12px 8px;border-bottom:1px solid #f0ead8;vertical-align:middle;width:72px;">${imgCell}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0ead8;vertical-align:middle;">
        <span style="font-size:14px;color:#1a1a1a;font-weight:500;">${item.name}</span>${variantText}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0ead8;vertical-align:middle;text-align:center;">
        <span style="font-size:13px;color:#555555;">x${item.quantity}</span>
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0ead8;vertical-align:middle;text-align:right;">
        <span style="font-size:14px;color:#1a1a1a;font-weight:600;">${item.formattedPrice}</span>
      </td>
    </tr>`;
    })
    .join("");
}

// ── Email HTML wrapper ────────────────────────────────────────────────────────
// ✅ Valid XHTML — better email client compatibility
function wrapEmail(title: string, body: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f0e8">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:600px;border-radius:16px;">

        <tr>
          <td bgcolor="#1a1a1a" style="padding:32px 40px;text-align:center;border-radius:16px 16px 0 0;">
            <p style="margin:0;font-size:11px;color:#daa520;letter-spacing:4px;text-transform:uppercase;">LUXURY ESSENTIALS</p>
            <h1 style="margin:8px 0 0;font-size:28px;color:#ffffff;letter-spacing:2px;font-weight:400;font-family:Georgia,serif;">TECH4U</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px;background-color:#ffffff;">
            ${body}
          </td>
        </tr>

        <tr>
          <td bgcolor="#1a1a1a" style="padding:24px 40px;text-align:center;border-radius:0 0 16px 16px;">
            <p style="margin:0 0 6px;color:#daa520;font-size:11px;letter-spacing:3px;">TECH4U - LUXURY REDEFINED</p>
            <p style="margin:0;color:#888888;font-size:12px;font-family:Arial,sans-serif;">
              <a href="mailto:info@tech4ru.com" style="color:#daa520;text-decoration:none;">info@tech4ru.com</a>
              &nbsp;|&nbsp;
              <a href="https://tech4ru.com" style="color:#daa520;text-decoration:none;">tech4ru.com</a>
            </p>
            <p style="margin:8px 0 0;color:#666666;font-size:11px;font-family:Arial,sans-serif;">
              You received this email because you placed an order at tech4ru.com
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION 1: ORDER CONFIRMATION (Customer)
// ✅ Called by send-order-notification route on checkout success
// ✅ Goes to INBOX: plain text body, no emoji subject, proper headers
// ─────────────────────────────────────────────────────────────────────────────
export async function sendOrderConfirmationEmail(
  to: string,
  orderNumber: string,
  name: string,
  items: any[],
  totalPKR: number,
  shippingAddress: string,
  paymentMethod: string,
  currencyCode: string,
  formattedTotal: string,
  formattedItems: FormattedItem[],
  customerCountry: string,
): Promise<boolean> {
  try {
    const isPKR = currencyCode === "PKR";

    const rowsToUse =
      formattedItems.length > 0
        ? formattedItems
        : items.map((item) => ({
            name: item.name || item.product_name || "Product",
            variant: item.variant || item.variant_name || null,
            quantity: item.quantity || 1,
            formattedPrice: formattedTotal,
            variant_image: item.variant_image || null,
            image: item.image || null,
            product_image: item.product_image || null,
          }));

    const itemRows = buildItemRows(rowsToUse);

    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;font-weight:400;font-family:Georgia,serif;">
        Thank you, ${name}!
      </h2>
      <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.6;font-family:Arial,sans-serif;">
        Your order has been confirmed. We will send WhatsApp and email updates as your order progresses.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f9f5ee" style="border:1px solid #e8dcc8;border-radius:12px;margin-bottom:28px;">
        <tr><td style="padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:6px 0;width:50%;">
                <p style="margin:0;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Order Number</p>
                <p style="margin:4px 0 0;font-size:16px;color:#1a1a1a;font-weight:700;font-family:Arial,sans-serif;">${orderNumber}</p>
              </td>
              <td style="padding:6px 0;text-align:right;">
                <p style="margin:0;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Status</p>
                <p style="margin:4px 0 0;font-size:14px;color:#2e7d32;font-weight:600;font-family:Arial,sans-serif;">Confirmed</p>
              </td>
            </tr>
            <tr><td colspan="2"><div style="border-top:1px solid #e8dcc8;margin:12px 0;"></div></td></tr>
            <tr>
              <td style="padding:4px 0;">
                <p style="margin:0;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Payment</p>
                <p style="margin:4px 0 0;font-size:14px;color:#1a1a1a;font-family:Arial,sans-serif;">${paymentMethod}</p>
              </td>
              <td style="padding:4px 0;text-align:right;">
                <p style="margin:0;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Shipping</p>
                <p style="margin:4px 0 0;font-size:14px;color:#2e7d32;font-weight:600;font-family:Arial,sans-serif;">FREE</p>
              </td>
            </tr>
            ${
              shippingAddress
                ? `
            <tr>
              <td colspan="2" style="padding:10px 0 0;">
                <p style="margin:0;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Shipping To</p>
                <p style="margin:4px 0 0;font-size:13px;color:#555555;font-family:Arial,sans-serif;">${shippingAddress}</p>
              </td>
            </tr>`
                : ""
            }
          </table>
        </td></tr>
      </table>

      <h3 style="margin:0 0 12px;font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:2px;font-weight:600;font-family:Arial,sans-serif;">
        Order Summary
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8dcc8;border-radius:12px;margin-bottom:16px;">
        <thead>
          <tr bgcolor="#f5f0e8">
            <th style="padding:10px 8px;font-size:11px;color:#888888;text-align:left;width:72px;font-family:Arial,sans-serif;"></th>
            <th style="padding:10px 8px;font-size:11px;color:#888888;text-align:left;font-family:Arial,sans-serif;">Product</th>
            <th style="padding:10px 8px;font-size:11px;color:#888888;text-align:center;font-family:Arial,sans-serif;">Qty</th>
            <th style="padding:10px 8px;font-size:11px;color:#888888;text-align:right;font-family:Arial,sans-serif;">Price (${currencyCode})</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr bgcolor="#f9f5ee">
            <td colspan="3" style="padding:14px 8px;font-size:14px;color:#888888;font-weight:600;font-family:Arial,sans-serif;">Total Amount</td>
            <td style="padding:14px 8px;font-size:18px;color:#daa520;font-weight:700;text-align:right;font-family:Arial,sans-serif;">${formattedTotal}</td>
          </tr>
        </tfoot>
      </table>

      ${!isPKR ? `<p style="font-size:12px;color:#aaaaaa;font-style:italic;margin:0 0 16px;font-family:Arial,sans-serif;">Prices shown in ${currencyCode} (approximate conversion from PKR)</p>` : ""}

      <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0faf0" style="border:1px solid #c8e6c9;border-radius:10px;margin-top:20px;">
        <tr><td style="padding:14px 18px;text-align:center;">
          <p style="margin:0;font-size:14px;color:#2e7d32;font-weight:600;font-family:Arial,sans-serif;">Free Shipping Included</p>
          <p style="margin:4px 0 0;font-size:12px;color:#555555;font-family:Arial,sans-serif;">You will receive a WhatsApp message with tracking when your order ships.</p>
        </td></tr>
      </table>
    `;

    // ✅ Plain text — required for inbox delivery
    const text = [
      `Order Confirmed - Tech4U`,
      ``,
      `Hi ${name},`,
      ``,
      `Your order #${orderNumber} has been confirmed.`,
      `Payment: ${paymentMethod}`,
      `Shipping: Free`,
      shippingAddress ? `Shipping To: ${shippingAddress}` : "",
      ``,
      `Order Total: ${formattedTotal}${!isPKR ? ` (${currencyCode} approx.)` : ""}`,
      ``,
      `Items:`,
      ...rowsToUse.map(
        (i) =>
          `- ${i.name}${i.variant ? ` (${i.variant})` : ""} x${i.quantity}: ${i.formattedPrice}`,
      ),
      ``,
      `Questions? Email us: info@tech4ru.com`,
      `tech4ru.com`,
    ]
      .filter((l) => l !== null)
      .join("\n");

    const html = wrapEmail(`Order Confirmed - ${orderNumber}`, body);
    const transporter = getTransporter();

    await transporter.sendMail({
      from: `Tech4U Orders <${process.env.GMAIL_USER}>`,
      replyTo: `Tech4U Support <${process.env.GMAIL_USER}>`,
      to,
      // ✅ NO emoji in subject — main reason for spam
      subject: `Order Confirmed - #${orderNumber} - Tech4U`,
      html,
      text, // ✅ Plain text alternative — KEY for inbox
    });

    console.log(
      `✅ Confirmation email → ${to} [${currencyCode}: ${formattedTotal}]`,
    );
    return true;
  } catch (err: any) {
    console.error("❌ sendOrderConfirmationEmail:", err?.message || err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION 2: OWNER ORDER ALERT
// ─────────────────────────────────────────────────────────────────────────────
export async function sendOwnerOrderAlert(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  items: any[],
  totalPKR: number,
  shippingAddress: string,
  paymentMethod: string,
  currencyCode: string,
  formattedTotal: string,
  formattedItems: FormattedItem[],
  customerCountry: string,
): Promise<boolean> {
  const ownerEmail = process.env.OWNER_EMAIL || process.env.GMAIL_USER;
  if (!ownerEmail) return false;

  try {
    const isPKR = currencyCode === "PKR";
    const pkrTotal = `Rs. ${Math.round(totalPKR).toLocaleString("en-PK")}`;

    const rowsToUse =
      formattedItems.length > 0
        ? formattedItems
        : items.map((item) => ({
            name: item.name || item.product_name || "Product",
            variant: item.variant || item.variant_name || null,
            quantity: item.quantity || 1,
            formattedPrice: formattedTotal,
          }));

    const body = `
      <h2 style="margin:0 0 4px;font-size:20px;color:#1a1a1a;font-family:Georgia,serif;">New Order Received!</h2>
      <p style="margin:0 0 24px;color:#555555;font-size:14px;font-family:Arial,sans-serif;">Order #${orderNumber}</p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f9f5ee" style="border:1px solid #e8dcc8;border-radius:12px;margin-bottom:24px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 10px;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Customer Details</p>
          <table cellpadding="5" cellspacing="0" border="0">
            <tr><td style="font-size:13px;color:#888888;font-family:Arial,sans-serif;width:90px;">Name</td><td style="font-size:13px;color:#1a1a1a;font-weight:600;font-family:Arial,sans-serif;">${customerName}</td></tr>
            <tr><td style="font-size:13px;color:#888888;font-family:Arial,sans-serif;">Email</td><td style="font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;">${customerEmail}</td></tr>
            <tr><td style="font-size:13px;color:#888888;font-family:Arial,sans-serif;">Phone</td><td style="font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;">${customerPhone || "-"}</td></tr>
            <tr><td style="font-size:13px;color:#888888;font-family:Arial,sans-serif;">Country</td><td style="font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;">${customerCountry}</td></tr>
            <tr><td style="font-size:13px;color:#888888;font-family:Arial,sans-serif;">Payment</td><td style="font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;">${paymentMethod}</td></tr>
            <tr><td style="font-size:13px;color:#888888;font-family:Arial,sans-serif;">Address</td><td style="font-size:13px;color:#555555;font-family:Arial,sans-serif;">${shippingAddress || "-"}</td></tr>
          </table>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8dcc8;border-radius:12px;margin-bottom:16px;">
        <thead>
          <tr bgcolor="#f5f0e8">
            <th style="padding:10px 8px;font-size:11px;color:#888888;text-align:left;width:72px;font-family:Arial,sans-serif;"></th>
            <th style="padding:10px 8px;font-size:11px;color:#888888;text-align:left;font-family:Arial,sans-serif;">Product</th>
            <th style="padding:10px 8px;font-size:11px;color:#888888;text-align:center;font-family:Arial,sans-serif;">Qty</th>
            <th style="padding:10px 8px;font-size:11px;color:#888888;text-align:right;font-family:Arial,sans-serif;">${currencyCode} Price</th>
          </tr>
        </thead>
        <tbody>${buildItemRows(rowsToUse)}</tbody>
        <tfoot>
          <tr bgcolor="#f9f5ee">
            <td colspan="3" style="padding:12px 8px;font-size:13px;color:#888888;font-family:Arial,sans-serif;">Total (${currencyCode})</td>
            <td style="padding:12px 8px;font-size:16px;color:#daa520;font-weight:700;text-align:right;font-family:Arial,sans-serif;">${formattedTotal}</td>
          </tr>
          ${!isPKR ? `<tr><td colspan="3" style="padding:4px 8px 12px;font-size:12px;color:#888888;font-family:Arial,sans-serif;">Total (PKR)</td><td style="padding:4px 8px 12px;font-size:13px;color:#555555;text-align:right;font-family:Arial,sans-serif;">${pkrTotal}</td></tr>` : ""}
        </tfoot>
      </table>
    `;

    const text = `New Order #${orderNumber} - Tech4U\n\nCustomer: ${customerName}\nEmail: ${customerEmail}\nPhone: ${customerPhone || "-"}\nCountry: ${customerCountry}\nPayment: ${paymentMethod}\nAddress: ${shippingAddress || "-"}\n\nTotal (${currencyCode}): ${formattedTotal}${!isPKR ? `\nTotal (PKR): ${pkrTotal}` : ""}`;

    const html = wrapEmail(`New Order #${orderNumber}`, body);
    const transporter = getTransporter();

    await transporter.sendMail({
      from: `Tech4U Orders <${process.env.GMAIL_USER}>`,
      replyTo: `Tech4U Orders <${process.env.GMAIL_USER}>`,
      to: ownerEmail,
      subject: `New Order #${orderNumber} - ${customerName} (${currencyCode}: ${formattedTotal})`,
      html,
      text,
    });

    console.log(
      `✅ Owner alert → ${ownerEmail} [${currencyCode}: ${formattedTotal}]`,
    );
    return true;
  } catch (err: any) {
    console.error("❌ sendOwnerOrderAlert:", err?.message || err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION 3: STATUS UPDATE EMAIL — shipped / delivered / cancelled
// ✅ Already goes to inbox — keeping exact same pattern
// ─────────────────────────────────────────────────────────────────────────────
export async function sendStatusUpdateEmail(
  to: string,
  customerName: string,
  orderNumber: string,
  status: "shipped" | "delivered" | "cancelled" | "processing" | "confirmed",
  trackingNumber?: string,
  courierName?: string,
  courierTrackingUrl?: string,
  estimatedDays?: string,
  items?: any[],
  formattedItems?: FormattedItem[],
  formattedTotal?: string,
  customerCountry?: string,
  cancelReason?: string,
): Promise<boolean> {
  try {
    const country = customerCountry || "Pakistan";
    const cfg = getCurrencyForCountry(country);
    const currencyCode = cfg.code;
    const displayTotal = formattedTotal || "-";
    const fItems = formattedItems || [];

    const statusConfig: Record<
      string,
      { label: string; title: string; color: string; message: string }
    > = {
      shipped: {
        label: "SHIPPED",
        title: "Your Order Has Shipped",
        color: "#1565c0",
        message:
          "Great news! Your order is on its way. Track it using the details below.",
      },
      delivered: {
        label: "DELIVERED",
        title: "Order Delivered",
        color: "#2e7d32",
        message:
          "Your order has been delivered. We hope you love your purchase!",
      },
      cancelled: {
        label: "CANCELLED",
        title: "Order Cancelled",
        color: "#c62828",
        message: cancelReason
          ? `Your order has been cancelled. Reason: ${cancelReason}`
          : "Your order has been cancelled. Please contact us if you have questions.",
      },
      processing: {
        label: "PROCESSING",
        title: "Order Being Processed",
        color: "#e65100",
        message:
          "We are preparing your order. You will receive an update when it ships.",
      },
      confirmed: {
        label: "CONFIRMED",
        title: "Order Confirmed",
        color: "#2e7d32",
        message: "Your order has been confirmed and will be processed shortly.",
      },
    };

    const sc = statusConfig[status] || statusConfig["processing"];

    const shippingBlock =
      status === "shipped" && courierName
        ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#e8f4fd" style="border:1px solid #bee3f8;border-radius:12px;margin:20px 0;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 10px;font-size:12px;color:#1565c0;font-weight:600;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;">Shipping Details</p>
          <table cellpadding="5" cellspacing="0" border="0">
            <tr><td style="font-size:13px;color:#555555;font-family:Arial,sans-serif;min-width:110px;">Courier</td><td style="font-size:13px;color:#1a1a1a;font-weight:600;font-family:Arial,sans-serif;">${courierName}</td></tr>
            ${trackingNumber ? `<tr><td style="font-size:13px;color:#555555;font-family:Arial,sans-serif;">Tracking No.</td><td style="font-size:13px;color:#1a1a1a;font-weight:600;font-family:Arial,sans-serif;">${trackingNumber}</td></tr>` : ""}
            ${estimatedDays ? `<tr><td style="font-size:13px;color:#555555;font-family:Arial,sans-serif;">Est. Delivery</td><td style="font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;">${estimatedDays}</td></tr>` : ""}
            ${courierTrackingUrl ? `<tr><td colspan="2" style="padding-top:8px;"><a href="${courierTrackingUrl}" style="color:#1565c0;font-size:13px;font-family:Arial,sans-serif;">Track Your Order &rarr;</a></td></tr>` : ""}
          </table>
        </td></tr>
      </table>`
        : "";

    const itemsBlock =
      fItems.length > 0
        ? `
      <h3 style="margin:20px 0 10px;font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Order Summary</h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8dcc8;border-radius:10px;margin-bottom:16px;">
        <thead>
          <tr bgcolor="#f5f0e8">
            <th style="padding:8px;font-size:11px;color:#888888;text-align:left;width:72px;font-family:Arial,sans-serif;"></th>
            <th style="padding:8px;font-size:11px;color:#888888;text-align:left;font-family:Arial,sans-serif;">Product</th>
            <th style="padding:8px;font-size:11px;color:#888888;text-align:center;font-family:Arial,sans-serif;">Qty</th>
            <th style="padding:8px;font-size:11px;color:#888888;text-align:right;font-family:Arial,sans-serif;">${currencyCode}</th>
          </tr>
        </thead>
        <tbody>${buildItemRows(fItems)}</tbody>
        <tfoot>
          <tr bgcolor="#f9f5ee">
            <td colspan="3" style="padding:12px 8px;font-size:13px;color:#888888;font-family:Arial,sans-serif;">Total</td>
            <td style="padding:12px 8px;font-size:16px;color:#daa520;font-weight:700;text-align:right;font-family:Arial,sans-serif;">${displayTotal}</td>
          </tr>
        </tfoot>
      </table>
      ${cfg.code !== "PKR" ? `<p style="font-size:11px;color:#aaaaaa;font-style:italic;margin:0 0 16px;font-family:Arial,sans-serif;">Prices shown in ${cfg.code} (approx.)</p>` : ""}`
        : "";

    const body = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr><td align="center">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr><td bgcolor="${sc.color}22" style="border:1px solid ${sc.color}66;border-radius:50px;padding:10px 24px;">
              <span style="font-size:15px;color:${sc.color};font-weight:600;font-family:Arial,sans-serif;">${sc.label} - ${sc.title}</span>
            </td></tr>
          </table>
        </td></tr>
      </table>

      <p style="margin:0 0 8px;font-size:16px;color:#1a1a1a;font-family:Georgia,serif;">Hi ${customerName},</p>
      <p style="margin:0 0 20px;font-size:14px;color:#555555;line-height:1.7;font-family:Arial,sans-serif;">${sc.message}</p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f9f5ee" style="border:1px solid #e8dcc8;border-radius:10px;margin-bottom:20px;">
        <tr><td style="padding:14px 18px;font-family:Arial,sans-serif;">
          <span style="font-size:13px;color:#888888;">Order Number: </span>
          <span style="font-size:14px;color:#1a1a1a;font-weight:700;">${orderNumber}</span>
        </td></tr>
      </table>

      ${shippingBlock}
      ${itemsBlock}
    `;

    const text = [
      `${sc.title} - Tech4U`,
      ``,
      `Hi ${customerName},`,
      ``,
      sc.message,
      ``,
      `Order: ${orderNumber}`,
      status === "shipped" && courierName ? `Courier: ${courierName}` : "",
      trackingNumber ? `Tracking: ${trackingNumber}` : "",
      estimatedDays ? `Est. Delivery: ${estimatedDays}` : "",
      courierTrackingUrl ? `Track: ${courierTrackingUrl}` : "",
      `Total: ${displayTotal}`,
      ``,
      `tech4ru.com | info@tech4ru.com`,
    ]
      .filter(Boolean)
      .join("\n");

    const html = wrapEmail(`${sc.title} - ${orderNumber}`, body);
    const transporter = getTransporter();

    await transporter.sendMail({
      from: `Tech4U Orders <${process.env.GMAIL_USER}>`,
      replyTo: `Tech4U Support <${process.env.GMAIL_USER}>`,
      to,
      // ✅ NO emoji — same as other emails that reach inbox
      subject: `${sc.title} - Order #${orderNumber} - Tech4U`,
      html,
      text,
    });

    console.log(
      `✅ Status email (${status}) → ${to} [${currencyCode}: ${displayTotal}]`,
    );
    return true;
  } catch (err: any) {
    console.error("❌ sendStatusUpdateEmail:", err?.message || err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION 4: OWNER STATUS ALERT
// ─────────────────────────────────────────────────────────────────────────────
export async function sendOwnerStatusAlert(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  status: string,
  notes?: string,
): Promise<boolean> {
  const ownerEmail = process.env.OWNER_EMAIL || process.env.GMAIL_USER;
  if (!ownerEmail) return false;

  try {
    const label = status.toUpperCase();

    const body = `
      <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a1a;font-family:Georgia,serif;">Order Status Update</h2>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8dcc8;border-radius:10px;">
        <tr bgcolor="#f5f0e8"><td style="padding:10px 16px;font-size:13px;color:#888888;font-family:Arial,sans-serif;width:110px;">Order</td><td style="padding:10px 16px;font-size:14px;color:#1a1a1a;font-weight:700;font-family:Arial,sans-serif;">${orderNumber}</td></tr>
        <tr><td style="padding:10px 16px;font-size:13px;color:#888888;font-family:Arial,sans-serif;">Status</td><td style="padding:10px 16px;font-size:14px;color:#1a1a1a;font-family:Arial,sans-serif;">${label}</td></tr>
        <tr bgcolor="#f5f0e8"><td style="padding:10px 16px;font-size:13px;color:#888888;font-family:Arial,sans-serif;">Customer</td><td style="padding:10px 16px;font-size:14px;color:#1a1a1a;font-family:Arial,sans-serif;">${customerName}</td></tr>
        <tr><td style="padding:10px 16px;font-size:13px;color:#888888;font-family:Arial,sans-serif;">Email</td><td style="padding:10px 16px;font-size:14px;color:#1a1a1a;font-family:Arial,sans-serif;">${customerEmail}</td></tr>
        <tr bgcolor="#f5f0e8"><td style="padding:10px 16px;font-size:13px;color:#888888;font-family:Arial,sans-serif;">Phone</td><td style="padding:10px 16px;font-size:14px;color:#1a1a1a;font-family:Arial,sans-serif;">${customerPhone || "-"}</td></tr>
        ${notes ? `<tr><td style="padding:10px 16px;font-size:13px;color:#888888;font-family:Arial,sans-serif;">Notes</td><td style="padding:10px 16px;font-size:13px;color:#555555;font-family:Arial,sans-serif;">${notes}</td></tr>` : ""}
      </table>
    `;

    const text = `Order ${label} - Tech4U\n\nOrder: ${orderNumber}\nStatus: ${label}\nCustomer: ${customerName}\nEmail: ${customerEmail}\nPhone: ${customerPhone || "-"}${notes ? `\nNotes: ${notes}` : ""}`;
    const html = wrapEmail(`Order ${label} - ${orderNumber}`, body);
    const transporter = getTransporter();

    await transporter.sendMail({
      from: `Tech4U Orders <${process.env.GMAIL_USER}>`,
      replyTo: `Tech4U Orders <${process.env.GMAIL_USER}>`,
      to: ownerEmail,
      subject: `Order ${label} - #${orderNumber} (${customerName})`,
      html,
      text,
    });

    console.log(`✅ Owner status alert (${status}) → ${ownerEmail}`);
    return true;
  } catch (err: any) {
    console.error("❌ sendOwnerStatusAlert:", err?.message || err);
    return false;
  }
}
