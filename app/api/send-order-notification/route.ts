// app/api/send-order-notification/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Email configuration - Using your Gmail credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderNumber,
      email, // Customer's email
      phone, // Customer's phone
      name,
      items,
      subtotal,
      shipping,
      total,
      shippingAddress,
      paymentMethod,
    } = body;

    // Validate required fields
    if (!orderNumber || !email || !name || !items) {
      console.error("Missing required fields:", {
        orderNumber,
        email,
        name,
        items,
      });
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("📧 Sending order confirmation to:", email);
    console.log("Order Number:", orderNumber);
    console.log("Total Amount:", total);

    // Format order items HTML for email
    const itemsHtml = items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${
          item.name
        } ${item.variant ? `(${item.variant})` : ""} ${
          item.piecesPerUnit > 1 ? `(${item.piecesPerUnit}-Piece)` : ""
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${
          item.quantity
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">PKR ${item.price.toLocaleString()}</td>
       </>
    `
      )
      .join("");

    // Email HTML content for customer
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
          .logo span { color: #333; }
          .order-details { background: #f9f5f0; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .order-number { font-size: 20px; font-weight: bold; color: #daa520; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background: #daa520; color: white; padding: 12px; text-align: left; }
          .total-row { font-size: 18px; font-weight: bold; color: #daa520; text-align: right; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #eee; margin-top: 20px; }
          .button { display: inline-block; background: #daa520; color: white; padding: 12px 24px; text-decoration: none; border-radius: 30px; margin-top: 20px; }
          .button:hover { background: #b8860b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">TECH<span>4U</span></div>
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
              <tr><td colspan="2" style="text-align: right; padding: 12px;"><strong>Subtotal:</strong></td>
              <td style="text-align: right;">PKR ${subtotal.toLocaleString()}</td>
              </tr>
              <tr><td colspan="2" style="text-align: right; padding: 12px;"><strong>Shipping:</strong></td>
              <td style="text-align: right;">${
                shipping === 0 ? "Free" : `PKR ${shipping.toLocaleString()}`
              }</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right; padding: 12px;"><strong>Total:</strong></td>
                <td style="text-align: right;">PKR ${total.toLocaleString()}</td>
              </tr>
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

    // Admin/Alert Email (to owner)
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>New Order Alert - Tech4U</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #daa520; color: white; padding: 20px; text-align: center; }
          .order-details { background: #f9f5f0; padding: 20px; margin: 20px 0; }
          .order-number { font-size: 24px; font-weight: bold; color: #daa520; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🛍️ New Order Received!</h2>
          </div>
          
          <div class="order-details">
            <p><strong>Order Number:</strong> <span class="order-number">${orderNumber}</span></p>
            <p><strong>Customer:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Total Amount:</strong> PKR ${total.toLocaleString()}</p>
          </div>
          
          <p><strong>Shipping Address:</strong><br/>${shippingAddress}</p>
          
          <p><strong>Order Items:</strong></p>
          <ul>
            ${items
              .map(
                (item: any) =>
                  `<li>${item.name} ${
                    item.variant ? `(${item.variant})` : ""
                  } x${item.quantity} = PKR ${item.price.toLocaleString()}</li>`
              )
              .join("")}
          </ul>
          
          <p>
            <a href="${
              process.env.NEXT_PUBLIC_APP_URL
            }/admin/orders" style="background:#daa520;color:white;padding:10px;text-decoration:none;">View Order</a>
          </p>
        </div>
      </body>
      </html>
    `;

    // 1. Send email to customer
    const customerEmailResult = await transporter.sendMail({
      from: `"Tech4U" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email, // Customer's email
      subject: `Order Confirmation #${orderNumber} - Tech4U`,
      html: emailHtml,
    });
    console.log(
      "✅ Customer email sent to:",
      email,
      "| Message ID:",
      customerEmailResult.messageId
    );

    // 2. Send alert email to owner (tech4ruu@gmail.com)
    const ownerEmailResult = await transporter.sendMail({
      from: `"Tech4U Orders" <${process.env.SMTP_FROM_EMAIL}>`,
      to: process.env.OWNER_EMAIL, // Owner's email
      subject: `🔔 NEW ORDER #${orderNumber} - PKR ${total.toLocaleString()}`,
      html: adminEmailHtml,
    });
    console.log("✅ Owner alert email sent to:", process.env.OWNER_EMAIL);

    // 3. Send WhatsApp notification (Optional - using Baileys)
    // You can add WhatsApp code here if needed

    return NextResponse.json({
      success: true,
      message: "Order confirmation emails sent successfully",
      customerEmailSent: true,
      ownerEmailSent: true,
    });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send order confirmation" },
      { status: 500 }
    );
  }
}
