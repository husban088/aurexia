import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

// ✅ Supported currencies for Australia Stripe account
// AU customers → AUD, US customers → USD, UK customers → GBP
const SUPPORTED_CURRENCIES = [
  "usd",
  "gbp",
  "aud",
  "eur",
  "cad",
  "inr",
  "aed",
  "sar",
];

// ✅ PKR is NOT supported by Stripe — convert to USD automatically
const CURRENCY_FALLBACK: Record<string, string> = {
  pkr: "usd", // Pakistan → USD (Stripe doesn't support PKR)
};

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "aud", metadata } = await request.json();

    // ✅ Normalize currency to lowercase
    const rawCurrency = currency.toLowerCase();

    // ✅ Apply fallback if currency not supported (e.g. PKR → USD)
    const finalCurrency = CURRENCY_FALLBACK[rawCurrency] ?? rawCurrency;

    // ✅ Safety check — unknown currency block
    if (!SUPPORTED_CURRENCIES.includes(finalCurrency)) {
      return NextResponse.json(
        { error: `Currency "${finalCurrency}" is not supported` },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents (e.g. 10.00 USD → 1000)
      currency: finalCurrency, // "usd" | "gbp" | "aud"
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true, // Stripe automatically shows best method per country
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      currency: finalCurrency, // Return final currency so frontend knows
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
