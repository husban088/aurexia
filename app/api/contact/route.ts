import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

/* ─── Validation helpers ─────────────────────────── */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidName(name: string): boolean {
  return name.trim().length >= 4;
}

function isValidMessage(msg: string): boolean {
  return msg.trim().length >= 1;
}

function isValidSubject(sub: string): boolean {
  return sub.trim().length >= 1;
}

// Create transporter once outside the handler for reuse (connection pooling)
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // SPEED OPTIMIZATIONS:
      pool: true, // Enable connection pooling
      maxConnections: 5, // Max connections
      maxMessages: 100, // Max messages per connection
      rateDelta: 0, // No rate limiting
      rateLimit: 0, // No rate limiting
      socketTimeout: 5000, // 5 second timeout
      connectionTimeout: 5000, // 5 second connection timeout
    });
  }
  return transporter;
}

/* ─── POST handler - OPTIMIZED FOR SPEED ───────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    /* Server-side validation */
    const errors: Record<string, string> = {};
    if (!isValidName(name)) errors.name = "Name must be at least 4 characters";
    if (!isValidEmail(email))
      errors.email = "Please enter a valid email address";
    if (!isValidSubject(subject)) errors.subject = "Subject is required";
    if (!isValidMessage(message)) errors.message = "Message is required";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // Get optimized transporter
    const mailTransporter = getTransporter();

    // SIMPLIFIED HTML - Faster to process
    const ownerHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;padding:20px;background:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;background:white;border-radius:10px;overflow:hidden;">
<div style="background:#1a1a1a;color:white;padding:20px;text-align:center;">
<h2>New Contact Message</h2>
<p style="margin:0">Aurexia Store</p>
</div>
<div style="padding:20px">
<p><strong>From:</strong> ${name}</p>
<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
<p><strong>Subject:</strong> ${subject}</p>
<p><strong>Message:</strong></p>
<div style="background:#f9f9f9;padding:15px;border-left:3px solid #b49150;margin-top:10px">${message.replace(
      /\n/g,
      "<br>"
    )}</div>
</div>
<div style="background:#f0f0f0;padding:10px;text-align:center;font-size:12px">
<p>Sent from Aurexia Contact Form</p>
</div>
</div>
</body>
</html>`;

    const customerHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;padding:20px;background:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;background:white;border-radius:10px;overflow:hidden;">
<div style="background:#1a1a1a;color:white;padding:20px;text-align:center;">
<h2>Thank You for Contacting Us!</h2>
</div>
<div style="padding:20px">
<p>Dear ${name.split(" ")[0]},</p>
<p>We have received your message and our team will get back to you within 24 hours.</p>
<p><strong>Your message:</strong> ${subject}</p>
<p>Thank you for choosing Aurexia!</p>
</div>
<div style="background:#f0f0f0;padding:10px;text-align:center;font-size:12px">
<p>&copy; Aurexia Store - Pakistan</p>
</div>
</div>
</body>
</html>`;

    // Send emails in PARALLEL for maximum speed
    const [ownerResult, customerResult] = await Promise.allSettled([
      mailTransporter.sendMail({
        from: `"Aurexia" <${process.env.SMTP_USER}>`,
        to: process.env.OWNER_EMAIL || "husbanshk@gmail.com",
        replyTo: email.trim(),
        subject: `New Contact: ${subject}`,
        html: ownerHtml,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
      }),
      mailTransporter.sendMail({
        from: `"Aurexia Store" <${process.env.SMTP_USER}>`,
        to: email.trim(),
        subject: "We received your message - Aurexia",
        html: customerHtml,
        text: `Thank you for contacting Aurexia. We will get back to you within 24 hours.`,
      }),
    ]);

    // Check if at least one email sent successfully
    if (
      ownerResult.status === "rejected" &&
      customerResult.status === "rejected"
    ) {
      console.error("Both emails failed to send");
      return NextResponse.json(
        { success: false, message: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Contact API error:", errMsg);
    return NextResponse.json(
      { success: false, message: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}
