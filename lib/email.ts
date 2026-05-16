// lib/email.ts
// ✅ COMPLETE FIX - Only tech4ru.com in footer (plain text)
// ✅ No email, no extra text

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM = '"Tech4U Orders" <orders@tech4ru.com>';
const REPLY_TO = "info@tech4ru.com";

// ─── Domain - PLAIN TEXT ONLY ────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  name: string;
  variant?: string | null;
  quantity: number;
  price: number;
  piecesPerUnit?: number;
  variant_image?: string | null;
  image?: string | null;
  product_image?: string | null;
}

interface FormattedItem {
  name: string;
  variant?: string | null;
  quantity: number;
  formattedPrice: string;
  pricePKR?: number;
  variant_image?: string | null;
}

// ─── Currency Conversion ──────────────────────────────────────────────────────
const PKR_RATES: Record<
  string,
  { symbol: string; rate: number; locale: string }
> = {
  Pakistan: { symbol: "PKR", rate: 1, locale: "en-PK" },
  "United States": { symbol: "USD", rate: 0.0036, locale: "en-US" },
  "United Kingdom": { symbol: "GBP", rate: 0.0028, locale: "en-GB" },
  Australia: { symbol: "AUD", rate: 0.0055, locale: "en-AU" },
  Canada: { symbol: "CAD", rate: 0.0049, locale: "en-CA" },
  "United Arab Emirates": { symbol: "AED", rate: 0.013, locale: "ar-AE" },
  Germany: { symbol: "EUR", rate: 0.0033, locale: "de-DE" },
  France: { symbol: "EUR", rate: 0.0033, locale: "fr-FR" },
  "Saudi Arabia": { symbol: "SAR", rate: 0.013, locale: "ar-SA" },
};

function convertPrice(pkrAmount: number, country: string): string {
  const cfg = PKR_RATES[country];
  if (!cfg || cfg.symbol === "PKR") {
    return "PKR " + Math.round(pkrAmount).toLocaleString("en-PK");
  }
  const converted = pkrAmount * cfg.rate;
  return new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: cfg.symbol,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
}

// ─── Core sendEmail - Minimal headers ─────────────────────────────────────────
async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  text: string,
): Promise<boolean> {
  try {
    const toArray = Array.isArray(to) ? to : [to];
    const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: toArray,
      reply_to: REPLY_TO,
      subject,
      html,
      text,
      headers: {
        "X-Entity-Ref-ID": `tech4ru-${uid}`,
        "X-Mailer": "Tech4U/1.0",
      },
    });

    if (error) {
      console.error("Resend error:", JSON.stringify(error));
      return false;
    }

    console.log(
      `Email sent [${data?.id}] to ${toArray.join(", ")} | ${subject}`,
    );
    return true;
  } catch (err: any) {
    console.error("Email exception:", err?.message || err);
    return false;
  }
}


// ─── Minimal HTML wrapper ─────────────────────────────────────────────────────
function minimalWrap(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;font-size:14px;color:#333;">
${content}
</body>
</html>`;
}

// ─── Build item rows ─────────────────────────────────────────────────────────
function buildItemRowsHtml(items: any[], country?: string): string {
  return items
    .map((item) => {
      const ppu = item.piecesPerUnit || 1;
      const totalPrice = item.price * ppu;
      const price = country
        ? convertPrice(totalPrice, country)
        : "PKR " + totalPrice.toLocaleString("en-PK");
      return `
    <tr>
      <td style="padding:4px 0;">${item.name}${item.variant ? ` (${item.variant})` : ""}</td>
      <td style="padding:4px 0;text-align:center;">x${item.quantity}</td>
      <td style="padding:4px 0;text-align:right;">${price}</td>
    </tr>`;
    })
    .join("");
}

function buildItemRowsPlain(items: any[], country?: string): string {
  return items
    .map((item) => {
      const ppu = item.piecesPerUnit || 1;
      const totalPrice = item.price * ppu;
      const price = country
        ? convertPrice(totalPrice, country)
        : "PKR " + totalPrice.toLocaleString("en-PK");
      return `- ${item.name}${item.variant ? ` (${item.variant})` : ""} x${item.quantity}: ${price}`;
    })
    .join("\n");
}

// ============================================================
// 1. ORDER CONFIRMATION - Customer
// ============================================================
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
  formattedItems?: any[],
  customerCountry?: string,
): Promise<boolean> {
  const country = customerCountry || "Pakistan";
  const displayTotal = convertPrice(total, country);
  const itemsList = items.length > 0 ? items : (formattedItems as any) || [];

  const itemRowsHtml = buildItemRowsHtml(itemsList, country);
  const itemRowsPlain = buildItemRowsPlain(itemsList, country);

  const html = minimalWrap(`
    <h2 style="margin:0 0 10px;color:#333;">Order Confirmed</h2>
    <p style="margin:0 0 20px;">Hello ${customerName}, your order has been confirmed.</p>
    
    <table style="border-collapse:collapse;width:100%;max-width:500px;">
      <tr><td style="padding:4px 0;"><strong>Order Number:</strong>ERC20<td style="padding:4px 0;">${orderNumber}ERC20</tr>
      <tr><td style="padding:4px 0;"><strong>Total:</strong>ERC20<td style="padding:4px 0;">${displayTotal}ERC20</tr>
      <tr><td style="padding:4px 0;"><strong>Payment:</strong>ERC20<td style="padding:4px 0;">${paymentMethod}ERC20</tr>
      <tr><td style="padding:4px 0;vertical-align:top;"><strong>Ship To:</strong>ERC20<td style="padding:4px 0;">${shippingAddress}ERC20</tr>
    </table>
    
    <p style="margin:15px 0 5px;"><strong>Items Ordered:</strong></p>
    <table style="border-collapse:collapse;width:100%;max-width:500px;">
      ${itemRowsHtml}
      <tr style="border-top:1px solid #ccc;"><td style="padding:8px 0 0;"><strong>Total</strong>ERC20<td style="padding:8px 0 0;text-align:center;">ERC20<td style="padding:8px 0 0;text-align:right;"><strong>${displayTotal}</strong>ERC20</tr>
    </table>
    
    <p style="margin:20px 0 0;">Shipping is free. We will notify you when your order is processed.</p>
  `);

  const text = `TECH4U - ORDER CONFIRMED

Hello ${customerName},

Your order has been confirmed.

Order Number: ${orderNumber}
Total: ${displayTotal}
Payment: ${paymentMethod}
Ship To: ${shippingAddress}

Items Ordered:
${itemRowsPlain}
Total: ${displayTotal}

Shipping: FREE
`;

  return sendEmail(
    customerEmail,
    `Order Confirmed - ${orderNumber} | Tech4U`,
    html,
    text,
  );
}

// ============================================================
// 2. OWNER ORDER ALERT - Owner
// ============================================================
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
  formattedItems?: any[],
  customerCountry?: string,
): Promise<boolean> {
  const ownerEmails = (process.env.OWNER_EMAILS || "tech4ruu@gmail.com")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const displayTotal = "PKR " + Math.round(total).toLocaleString("en-PK");
  const now = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
  const itemsList = items.length > 0 ? items : (formattedItems as any) || [];
  const itemRowsPlain = buildItemRowsPlain(itemsList, "Pakistan");

  const html = minimalWrap(`
    <h2 style="margin:0 0 10px;color:#333;">New Order Received</h2>
    <p style="margin:0 0 5px;">${now} PKT</p>
    
    <table style="border-collapse:collapse;width:100%;max-width:500px;margin-top:15px;">
      <tr><td style="padding:4px 0;"><strong>Order Number:</strong>ERC20<td style="padding:4px 0;">${orderNumber}ERC20</tr>
      <tr><td style="padding:4px 0;"><strong>Total (PKR):</strong>ERC20<td style="padding:4px 0;">${displayTotal}ERC20</tr>
      <tr><td style="padding:4px 0;"><strong>Payment:</strong>ERC20<td style="padding:4px 0;">${paymentMethod}ERC20</tr>
      <tr><td style="padding:4px 0;"><strong>Customer:</strong>ERC20<td style="padding:4px 0;">${customerName}ERC20</tr>
      <tr><td style="padding:4px 0;"><strong>Country:</strong>ERC20<td style="padding:4px 0;">${customerCountry || "Pakistan"}ERC20</tr>
      <tr><td style="padding:4px 0;"><strong>Email:</strong>ERC20<td style="padding:4px 0;">${customerEmail}ERC20</tr>
      <tr><td style="padding:4px 0;"><strong>Phone:</strong>ERC20<td style="padding:4px 0;">${customerPhone}ERC20</tr>
      <tr><td style="padding:4px 0;vertical-align:top;"><strong>Address:</strong>ERC20<td style="padding:4px 0;">${shippingAddress}ERC20</tr>
    </table>
    
    <p style="margin:15px 0 5px;"><strong>Items Ordered:</strong></p>
    <pre style="margin:0;font-family:monospace;">${itemRowsPlain}</pre>
    <p style="margin:10px 0 0;"><strong>Total: ${displayTotal}</strong></p>
  `);

  const text = `NEW ORDER RECEIVED - Tech4U
Time: ${now} PKT

Order Number: ${orderNumber}
Total: ${displayTotal}
Payment: ${paymentMethod}

Customer: ${customerName}
Country: ${customerCountry || "Pakistan"}
Email: ${customerEmail}
Phone: ${customerPhone}
Address: ${shippingAddress}

Items:
${itemRowsPlain}
Total: ${displayTotal}
`;

  return sendEmail(
    ownerEmails,
    `New Order ${orderNumber} - ${displayTotal} | Tech4U`,
    html,
    text,
  );
}

// ============================================================
// 3. STATUS UPDATE EMAIL - Customer (ALL STATUSES)
// ============================================================
export async function sendStatusUpdateEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  newStatus: "shipped" | "delivered" | "cancelled" | "confirmed" | "processing",
  trackingNumber?: string,
  courierName?: string,
  courierTrackingUrl?: string,
  estimatedDays?: string,
  items?: OrderItem[],
  formattedItems?: any[],
  displayTotal?: string,
  customerCountry?: string,
): Promise<boolean> {
  const country = customerCountry || "Pakistan";

  let statusTitle = "";
  let statusHeadline = "";
  let statusNote = "";

  if (newStatus === "shipped") {
    statusTitle = "Order Shipped";
    statusHeadline = "Your order has been shipped.";
    statusNote = "Your package is on its way to you.";
  } else if (newStatus === "delivered") {
    statusTitle = "Order Delivered";
    statusHeadline = "Your order has been delivered.";
    statusNote = "Thank you for shopping with Tech4U.";
  } else if (newStatus === "cancelled") {
    statusTitle = "Order Cancelled";
    statusHeadline = "Your order has been cancelled.";
    statusNote = "If you have questions, please contact us.";
  } else if (newStatus === "confirmed") {
    statusTitle = "Order Confirmed";
    statusHeadline = "Your order has been confirmed.";
    statusNote = "We will start processing your order soon.";
  } else {
    statusTitle = "Order Processing";
    statusHeadline = "Your order is being processed.";
    statusNote = "We are preparing your order for shipment.";
  }

  // Build shipping info (only for shipped status)
  let shippingInfoHtml = "";
  let shippingInfoPlain = "";
  if (newStatus === "shipped" && courierName && trackingNumber) {
    shippingInfoHtml = `
      <p style="margin:15px 0 5px;"><strong>Shipping Details:</strong></p>
      <table style="border-collapse:collapse;width:100%;max-width:400px;">
        <tr><td style="padding:3px 0;">Courier:ERC20<td style="padding:3px 0;">${courierName}ERC20</tr>
        <tr><td style="padding:3px 0;">Tracking Number:ERC20<td style="padding:3px 0;">${trackingNumber}ERC20</tr>
        ${estimatedDays ? `<tr><td style="padding:3px 0;">Est. Delivery:ERC20<td style="padding:3px 0;">${estimatedDays}ERC20</tr>` : ""}
      </table>
    `;
    shippingInfoPlain = `\nShipping Details:\nCourier: ${courierName}\nTracking Number: ${trackingNumber}${estimatedDays ? `\nEst. Delivery: ${estimatedDays}` : ""}\n`;
  }

  // Build items table
  let itemsHtml = "";
  let itemsPlain = "";
  if (items && items.length > 0) {
    const itemRowsHtml = buildItemRowsHtml(items, country);
    const itemRowsPlain = buildItemRowsPlain(items, country);
    let totalDisplayFormatted = displayTotal;
    if (
      totalDisplayFormatted &&
      !totalDisplayFormatted.includes("PKR") &&
      !totalDisplayFormatted.includes("$") &&
      !totalDisplayFormatted.includes("£") &&
      !totalDisplayFormatted.includes("€")
    ) {
      const num = parseFloat(totalDisplayFormatted.replace(/[^0-9.]/g, ""));
      if (!isNaN(num)) {
        totalDisplayFormatted = convertPrice(num, country);
      }
    }

    itemsHtml = `
      <p style="margin:15px 0 5px;"><strong>Order Summary:</strong></p>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        ${itemRowsHtml}
        ${totalDisplayFormatted ? `<tr style="border-top:1px solid #ccc;"><td style="padding:8px 0 0;"><strong>Total</strong>ERC20<td style="padding:8px 0 0;text-align:center;">ERC20<td style="padding:8px 0 0;text-align:right;"><strong>${totalDisplayFormatted}</strong>ERC20</tr>` : ""}
      </table>
    `;
    itemsPlain = `\nOrder Summary:\n${itemRowsPlain}${totalDisplayFormatted ? `\nTotal: ${totalDisplayFormatted}` : ""}\n`;
  }

  const html = minimalWrap(`
    <h2 style="margin:0 0 10px;color:#333;">${statusTitle}</h2>
    <p style="margin:0 0 20px;">Hello ${customerName}, ${statusHeadline}</p>
    
    <table style="border-collapse:collapse;width:100%;max-width:400px;">
      <tr><td style="padding:4px 0;"><strong>Order Number:</strong>ERC20<td style="padding:4px 0;">${orderNumber}ERC20</tr>
    </table>
    
    ${shippingInfoHtml}
    ${itemsHtml}
    
    <p style="margin:20px 0 0;">${statusNote}</p>
  `);

  const subjectMap: Record<string, string> = {
    confirmed: `Order Confirmed - ${orderNumber} | Tech4U`,
    processing: `Order Processing - ${orderNumber} | Tech4U`,
    shipped: `Order Shipped - ${orderNumber} | Tech4U`,
    delivered: `Order Delivered - ${orderNumber} | Tech4U`,
    cancelled: `Order Cancelled - ${orderNumber} | Tech4U`,
  };

  const plainStatus = statusTitle.toUpperCase();
  const text = `TECH4U - ${plainStatus}

Hello ${customerName},

${statusHeadline}

Order Number: ${orderNumber}
${shippingInfoPlain}${itemsPlain}
${statusNote}}
`;

  return sendEmail(customerEmail, subjectMap[newStatus], html, text);
}

// ============================================================
// 4. OWNER STATUS ALERT
// ============================================================
export async function sendOwnerStatusAlert(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  status: "shipped" | "delivered" | "cancelled" | "confirmed" | "processing",
  extraInfo?: string,
): Promise<boolean> {
  const ownerEmails = (process.env.OWNER_EMAILS || "tech4ruu@gmail.com")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const statusLabel =
    status === "shipped"
      ? "SHIPPED"
      : status === "delivered"
        ? "DELIVERED"
        : status === "cancelled"
          ? "CANCELLED"
          : status === "confirmed"
            ? "CONFIRMED"
            : "PROCESSING";
  const now = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });

  const html = minimalWrap(`
    <h2 style="margin:0 0 10px;color:#333;">${statusLabel} - Admin Alert</h2>
    <p style="margin:0 0 15px;">${now} PKT</p>
    
    <table style="border-collapse:collapse;width:100%;max-width:400px;">
      <tr><td style="padding:4px 0;"><strong>Order:</strong>ERC20<td style="padding:4px 0;">${orderNumber}ERC20</tr>
      <tr><td style="padding:4px 0;"><strong>Status:</strong>ERC20<td style="padding:4px 0;">${statusLabel}ERC20</tr>
      <tr><td style="padding:4px 0;"><strong>Customer:</strong>ERC20<td style="padding:4px 0;">${customerName}ERC20</tr>
      <tr><td style="padding:4px 0;"><strong>Email:</strong>ERC20<td style="padding:4px 0;">${customerEmail}ERC20</tr>
      <tr><td style="padding:4px 0;"><strong>Phone:</strong>ERC20<td style="padding:4px 0;">${customerPhone}ERC20</tr>
      ${extraInfo ? `<tr><td style="padding:4px 0;vertical-align:top;"><strong>Info:</strong>ERC20<td style="padding:4px 0;">${extraInfo}ERC20</tr>` : ""}
    </table>
  `);

  const text = `${statusLabel} - Tech4U Admin
Time: ${now} PKT

Order: ${orderNumber}
Customer: ${customerName} | ${customerEmail} | ${customerPhone}
${extraInfo ? `Info: ${extraInfo}` : ""}
`;

  const subjects: Record<string, string> = {
    shipped: `Order ${orderNumber} Shipped | Tech4U Admin`,
    delivered: `Order ${orderNumber} Delivered | Tech4U Admin`,
    cancelled: `Order ${orderNumber} Cancelled | Tech4U Admin`,
    confirmed: `Order ${orderNumber} Confirmed | Tech4U Admin`,
    processing: `Order ${orderNumber} Processing | Tech4U Admin`,
  };

  return sendEmail(ownerEmails, subjects[status], html, text);
}
