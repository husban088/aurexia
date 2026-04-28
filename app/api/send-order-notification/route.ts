// app/api/send-order-notification/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// SMS via Twilio (optional - you'll need Twilio account)
// const twilioClient = require('twilio')(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderNumber,
      email,
      phone,
      name,
      items,
      subtotal,
      shipping,
      total,
      shippingAddress,
      paymentMethod,
    } = body;

    // Format order items HTML for email
    const itemsHtml = items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${
          item.name
        } ${item.variant ? `(${item.variant})` : ""} ${
          item.piecesPerUnit > 1 ? `(${item.piecesPerUnit}-Piece)` : ""
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${
          item.quantity
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">PKR ${item.price.toLocaleString()}</td>
      </tr>
    `
      )
      .join("");

    // Email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Tech4U</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #daa520; }
          .logo { font-size: 28px; font-weight: bold; color: #daa520; }
          .order-details { background: #f9f5f0; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .order-number { font-size: 20px; font-weight: bold; color: #daa520; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background: #daa520; color: white; padding: 10px; text-align: left; }
          .total-row { font-size: 18px; font-weight: bold; color: #daa520; text-align: right; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #eee; margin-top: 20px; }
          .button { display: inline-block; background: #daa520; color: white; padding: 12px 24px; text-decoration: none; border-radius: 30px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">TECH<span style="color: #333;">4U</span></div>
            <h2>Order Confirmation</h2>
          </div>
          
          <p>Dear ${name},</p>
          <p>Thank you for your order! Your order has been received and is being processed.</p>
          
          <div class="order-details">
            <p><strong>Order Number:</strong> <span class="order-number">${orderNumber}</span></p>
            <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          </div>
          
          <h3>Order Items</h3>
          <table class="items-table">
            <thead>
              <tr><th>Product</th><th>Qty</th><th>Price</th></tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr><td colspan="2" style="text-align: right; padding: 10px;"><strong>Subtotal:</strong></td><td style="text-align: right;">PKR ${subtotal.toLocaleString()}</td></tr>
              <tr><td colspan="2" style="text-align: right; padding: 10px;"><strong>Shipping:</strong></td><td style="text-align: right;">${
                shipping === 0 ? "Free" : `PKR ${shipping.toLocaleString()}`
              }</td></tr>
              <tr class="total-row"><td colspan="2" style="text-align: right; padding: 10px;"><strong>Total:</strong></td><td style="text-align: right;">PKR ${total.toLocaleString()}</td></tr>
            </tfoot>
          </table>
          
          <h3>Shipping Address</h3>
          <p>${shippingAddress}</p>
          
          <div style="text-align: center;">
            <a href="${
              process.env.NEXT_PUBLIC_APP_URL
            }/orders/${orderNumber}" class="button">Track Your Order</a>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Tech4U — All Rights Reserved</p>
            <p>Questions? Contact us at support@tech4u.com or call +92 123 4567890</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: `"Tech4U" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: `Order Confirmation #${orderNumber} - Tech4U`,
      html: emailHtml,
    });

    // SMS via Twilio (optional - uncomment if you have Twilio)
    // await twilioClient.messages.create({
    //   body: `Tech4U: Your order #${orderNumber} has been confirmed! Total: PKR ${total.toLocaleString()}. Track: ${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}`,
    //   to: phone,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    // });

    // For WhatsApp, you can use WhatsApp Business API or Twilio for WhatsApp
    // Alternatively, you can use a service like WATI or WhatsApp Cloud API

    return NextResponse.json({ success: true, message: "Notifications sent" });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
