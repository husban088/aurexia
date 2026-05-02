import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

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
      { status: 500 }
    );
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    // Check for duplicate webhook events (idempotency)
    const { data: existing } = await supabase
      .from("stripe_webhook_events")
      .select("id")
      .eq("id", event.id)
      .single();

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Log the webhook event
    await supabase.from("stripe_webhook_events").insert({
      id: event.id,
      type: event.type,
      data: event,
      processed_at: new Date().toISOString(),
    });

    // Process the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        const orderNumber = paymentIntent.metadata.orderNumber;

        if (orderNumber) {
          await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              status: "processing",
              payment_id: paymentIntent.id,
            })
            .eq("order_number", orderNumber);
        }
        break;

      case "payment_intent.payment_failed":
        const failedIntent = event.data.object;
        console.error("Payment failed:", failedIntent.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
