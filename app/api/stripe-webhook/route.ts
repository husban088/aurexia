// app/api/webhooks/stripe/route.ts
// ✅ payment_intent.succeeded → DB update + owner email foran
// ✅ payment_intent.payment_failed → DB update + owner email alert
// ✅ Idempotency — duplicate webhook ignore
// ✅ Email: shwaqas93@gmail.com + OWNER_EMAILS env

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

// ── Supabase (service role for webhook) ───────────────────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

// ── Email: send owner payment received alert ──────────────────────────────────
async function sendPaymentReceivedEmail(params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
  status: "succeeded" | "failed";
}) {
  const {
    orderNumber,
    customerName,
    customerEmail,
    amount,
    currency,
    paymentIntentId,
    status,
  } = params;

  // ── Gmail SMTP transporter ────────────────────────────────────────────────
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  // All owner emails — env + hardcoded backup
  const ownerEmailsRaw =
    process.env.OWNER_EMAILS || process.env.OWNER_EMAIL || "";
  const ownerEmailsList = ownerEmailsRaw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  // ✅ Always include shwaqas93@gmail.com
  if (!ownerEmailsList.includes("shwaqas93@gmail.com")) {
    ownerEmailsList.push("shwaqas93@gmail.com");
  }

  const currencySymbols: Record<string, string> = {
    usd: "$",
    gbp: "£",
    eur: "€",
    aud: "A$",
    cad: "C$",
    aed: "AED ",
    sar: "SAR ",
    inr: "₹",
    sgd: "S$",
    nzd: "NZ$",
  };
  const symbol =
    currencySymbols[currency.toLowerCase()] ?? currency.toUpperCase() + " ";
  const formattedAmount = `${symbol}${amount.toFixed(2)}`;
  const currencyUpper = currency.toUpperCase();

  const isSuccess = status === "succeeded";

  const subject = isSuccess
    ? `✅ Payment Received — ${formattedAmount} | Order #${orderNumber}`
    : `❌ Payment FAILED — Order #${orderNumber}`;

  const htmlBody = isSuccess
    ? `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a1a1a,#2d2d2d);padding:28px 32px;text-align:center;">
      <h1 style="color:#daa520;margin:0;font-size:22px;letter-spacing:2px;">✦ TECH4U ✦</h1>
      <p style="color:#888;margin:6px 0 0;font-size:12px;">Payment Notification</p>
    </div>

    <!-- Success Banner -->
    <div style="background:#d1fae5;padding:16px 32px;border-left:4px solid #10b981;text-align:center;">
      <p style="margin:0;color:#065f46;font-size:18px;font-weight:700;">
        ✅ Payment Successfully Received!
      </p>
    </div>

    <!-- Details -->
    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:14px;">Order Number</td>
          <td style="padding:12px 0;color:#1a1a1a;font-weight:700;font-size:14px;text-align:right;">#${orderNumber}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:14px;">Customer</td>
          <td style="padding:12px 0;color:#1a1a1a;font-size:14px;text-align:right;">${customerName}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:14px;">Customer Email</td>
          <td style="padding:12px 0;color:#1a1a1a;font-size:14px;text-align:right;">${customerEmail}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:14px;">Amount Received</td>
          <td style="padding:12px 0;font-size:18px;font-weight:700;color:#10b981;text-align:right;">${formattedAmount} ${currencyUpper}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:14px;">Payment ID</td>
          <td style="padding:12px 0;color:#888;font-size:12px;font-family:monospace;text-align:right;">${paymentIntentId}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;color:#666;font-size:14px;">Time</td>
          <td style="padding:12px 0;color:#1a1a1a;font-size:14px;text-align:right;">${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} (PKT)</td>
        </tr>
      </table>

      <div style="margin-top:24px;padding:16px;background:#fefce8;border-radius:8px;border:1px solid #fde68a;">
        <p style="margin:0;color:#92400e;font-size:13px;font-weight:600;">📦 Action Required</p>
        <p style="margin:6px 0 0;color:#78350f;font-size:13px;">Please process this order and update its status in your admin panel.</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9f9f9;padding:16px 32px;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0;color:#aaa;font-size:11px;">Tech4U Admin • Stripe Live Payment • ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`
    : `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:20px;">
    <div style="background:linear-gradient(135deg,#1a1a1a,#2d2d2d);padding:28px 32px;text-align:center;">
      <h1 style="color:#daa520;margin:0;font-size:22px;letter-spacing:2px;">✦ TECH4U ✦</h1>
    </div>
    <div style="background:#fee2e2;padding:16px 32px;border-left:4px solid #ef4444;text-align:center;">
      <p style="margin:0;color:#991b1b;font-size:18px;font-weight:700;">❌ Payment Failed</p>
    </div>
    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:14px;">Order Number</td>
          <td style="padding:12px 0;color:#1a1a1a;font-weight:700;font-size:14px;text-align:right;">#${orderNumber}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:14px;">Customer</td>
          <td style="padding:12px 0;color:#1a1a1a;font-size:14px;text-align:right;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;color:#666;font-size:14px;">Payment ID</td>
          <td style="padding:12px 0;color:#888;font-size:12px;font-family:monospace;text-align:right;">${paymentIntentId}</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"Tech4U Payments" <${process.env.GMAIL_USER}>`,
      to: ownerEmailsList.join(","),
      subject,
      html: htmlBody,
    });
    console.log(`✅ Payment email sent to: ${ownerEmailsList.join(", ")}`);
  } catch (err: any) {
    console.error("❌ Payment email failed:", err?.message);
  }
}

// ── Webhook handler ───────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: any;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabase();

  // ── Idempotency check ─────────────────────────────────────────────────────
  try {
    const { data: existing } = await supabase
      .from("stripe_webhook_events")
      .select("id")
      .eq("id", event.id)
      .single();

    if (existing) {
      console.log(`⚠️ Duplicate webhook event: ${event.id} — skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Log the webhook event
    await supabase.from("stripe_webhook_events").insert({
      id: event.id,
      type: event.type,
      data: event,
      processed_at: new Date().toISOString(),
    });
  } catch (dbErr: any) {
    // If stripe_webhook_events table doesn't exist, just continue
    console.warn("⚠️ stripe_webhook_events table issue:", dbErr?.message);
  }

  // ── Process events ────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      // ✅ PAYMENT SUCCESS
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as any;
        const orderNumber = paymentIntent.metadata?.orderNumber;
        const customerEmail = paymentIntent.metadata?.customerEmail || "";
        const customerName = paymentIntent.metadata?.customerName || "Customer";
        const amountReceived = paymentIntent.amount_received / 100;
        const currency = paymentIntent.currency;

        console.log(
          `✅ Payment succeeded: ${paymentIntent.id} | Order: ${orderNumber} | Amount: ${amountReceived} ${currency.toUpperCase()}`,
        );

        if (orderNumber) {
          const { error: dbErr } = await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              status: "confirmed", // ✅ confirmed (not processing)
              payment_id: paymentIntent.id,
              updated_at: new Date().toISOString(),
            })
            .eq("order_number", orderNumber);

          if (dbErr) {
            console.error("❌ DB update error:", dbErr.message);
          } else {
            console.log(`✅ Order ${orderNumber} → confirmed + paid`);
          }
        }

        // ✅ Send payment received email to owner (shwaqas93@gmail.com)
        await sendPaymentReceivedEmail({
          orderNumber: orderNumber || "N/A",
          customerName,
          customerEmail,
          amount: amountReceived,
          currency,
          paymentIntentId: paymentIntent.id,
          status: "succeeded",
        });

        break;
      }

      // ❌ PAYMENT FAILED
      case "payment_intent.payment_failed": {
        const failedIntent = event.data.object as any;
        const orderNumber = failedIntent.metadata?.orderNumber;
        const customerName = failedIntent.metadata?.customerName || "Customer";
        const customerEmail = failedIntent.metadata?.customerEmail || "";

        console.error(
          "❌ Payment failed:",
          failedIntent.id,
          "| Order:",
          orderNumber,
        );

        if (orderNumber) {
          await supabase
            .from("orders")
            .update({
              payment_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("order_number", orderNumber);
        }

        // ✅ Send failure alert email to owner
        await sendPaymentReceivedEmail({
          orderNumber: orderNumber || "N/A",
          customerName,
          customerEmail,
          amount: 0,
          currency: failedIntent.currency || "usd",
          paymentIntentId: failedIntent.id,
          status: "failed",
        });

        break;
      }

      // ✅ charge.succeeded — extra safety net (some Stripe setups send this)
      case "charge.succeeded": {
        const charge = event.data.object as any;
        const orderNumber = charge.metadata?.orderNumber;
        if (orderNumber) {
          await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              updated_at: new Date().toISOString(),
            })
            .eq("order_number", orderNumber);
          console.log(`✅ charge.succeeded for order: ${orderNumber}`);
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("❌ Webhook processing error:", err?.message || err);
    // Still return 200 so Stripe doesn't retry unnecessarily
    return NextResponse.json({ received: true, error: err.message });
  }
}
