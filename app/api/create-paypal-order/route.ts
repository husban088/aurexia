// app/api/create-paypal-order/route.ts
import { NextRequest, NextResponse } from "next/server";

const PAYPAL_API_URL =
  process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

// ✅ PayPal supported currencies (PKR NOT supported — fallback to USD)
const PAYPAL_CURRENCY_FALLBACK: Record<string, string> = {
  PKR: "USD", // Pakistan Rupee → US Dollar
};

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === "your_paypal_client_id") {
    throw new Error(
      "PayPal credentials not configured. Please add NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env.local"
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal token error:", error);
    throw new Error(`Failed to get PayPal token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "USD", orderData } = await request.json();

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // ✅ Apply currency fallback for unsupported currencies (e.g. PKR → USD)
    const rawCurrency = currency.toUpperCase();
    const finalCurrency = PAYPAL_CURRENCY_FALLBACK[rawCurrency] ?? rawCurrency;

    // Get PayPal access token
    let accessToken;
    try {
      accessToken = await getPayPalAccessToken();
    } catch (tokenError) {
      console.error("Token error:", tokenError);
      return NextResponse.json(
        {
          error:
            "PayPal authentication failed. Please check your API credentials.",
        },
        { status: 401 }
      );
    }

    // Create PayPal order
    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: finalCurrency,
              value: amount.toFixed(2),
            },
            description: orderData?.description || "Order from Tech4U",
            custom_id: orderData?.orderNumber,
          },
        ],
        application_context: {
          brand_name: "Tech4U",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/checkout`,
          cancel_url: `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/checkout`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PayPal order creation error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to create PayPal order" },
        { status: response.status }
      );
    }

    const approvalUrl = data.links?.find(
      (link: any) => link.rel === "approve"
    )?.href;

    return NextResponse.json({
      orderId: data.id,
      approvalUrl,
      currency: finalCurrency,
    });
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    return NextResponse.json(
      { error: "Failed to create PayPal order" },
      { status: 500 }
    );
  }
}
