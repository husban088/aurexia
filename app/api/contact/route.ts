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

// Create transporter outside handler for reuse
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// Send email asynchronously (fire and forget)
async function sendEmailAsync(
  name: string,
  email: string,
  subject: string,
  message: string
) {
  try {
    const transporterInstance = getTransporter();
    await transporterInstance.sendMail({
      from: `"Aurexia Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.OWNER_EMAIL || process.env.SMTP_USER,
      replyTo: email.trim(),
      subject: `📬 New Contact: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>New Contact Message</title>
        </head>
        <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" align="center" cellpadding="0" cellspacing="0"
                  style="max-width:600px;margin:0 auto;background:#111111;border:1px solid #1e1e1e;border-radius:4px;overflow:hidden;">

                  <!-- Header -->
                  <tr>
                    <td style="background:#0f0f0f;border-bottom:1px solid #1a1a1a;padding:28px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <p style="margin:0 0 4px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#b49150;font-weight:500;">Aurexia Store</p>
                            <h1 style="margin:0;font-size:22px;font-weight:300;color:#f5f0e8;letter-spacing:0.02em;">New Contact <em style="font-style:italic;color:#b49150;">Message</em></h1>
                          </td>
                          <td align="right">
                            <div style="width:42px;height:42px;border:1px solid rgba(180,145,80,0.25);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:rgba(180,145,80,0.07);">
                              <span style="font-size:18px;">✉</span>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:32px;">

                      <!-- Sender info grid -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                        <tr>
                          <td width="50%" style="padding-right:8px;padding-bottom:16px;vertical-align:top;">
                            <p style="margin:0 0 6px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#b49150;font-weight:500;">Full Name</p>
                            <p style="margin:0;font-size:15px;color:#f5f0e8;font-weight:300;">${name
                              .replace(/</g, "&lt;")
                              .replace(/>/g, "&gt;")}</p>
                          </td>
                          <td width="50%" style="padding-left:8px;padding-bottom:16px;vertical-align:top;">
                            <p style="margin:0 0 6px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#b49150;font-weight:500;">Email Address</p>
                            <p style="margin:0;font-size:15px;color:#f5f0e8;font-weight:300;">
                              <a href="mailto:${email}" style="color:#d4b87a;text-decoration:none;">${email}</a>
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td colspan="2" style="padding-bottom:16px;vertical-align:top;">
                            <p style="margin:0 0 6px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#b49150;font-weight:500;">Subject</p>
                            <p style="margin:0;font-size:15px;color:#f5f0e8;font-weight:300;">${subject
                              .replace(/</g, "&lt;")
                              .replace(/>/g, "&gt;")}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Divider -->
                      <div style="height:1px;background:linear-gradient(to right,rgba(180,145,80,0.4),transparent);margin-bottom:24px;"></div>

                      <!-- Message -->
                      <p style="margin:0 0 10px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#b49150;font-weight:500;">Message</p>
                      <div style="background:#0f0f0f;border:1px solid #1a1a1a;border-left:2px solid rgba(180,145,80,0.5);border-radius:2px;padding:20px 20px 20px 18px;">
                        <p style="margin:0;font-size:14px;color:rgba(245,240,232,0.8);line-height:1.8;white-space:pre-wrap;">${message
                          .replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;")}</p>
                      </div>

                      <!-- Reply CTA -->
                      <div style="margin-top:28px;text-align:center;">
                        <a href="mailto:${email}?subject=Re: ${encodeURIComponent(
        subject
      )}"
                          style="display:inline-block;padding:12px 28px;border:1px solid rgba(180,145,80,0.5);border-radius:2px;color:#b49150;font-size:11px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;font-weight:500;background:rgba(180,145,80,0.06);">
                          Reply to ${name}
                        </a>
                      </div>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="border-top:1px solid #1a1a1a;padding:16px 32px;background:#0f0f0f;">
                      <p style="margin:0;font-size:10px;color:rgba(245,240,232,0.25);letter-spacing:0.05em;">
                        Aurexia Store · Automated notification · ${new Date().toLocaleString(
                          "en-PK",
                          { timeZone: "Asia/Karachi" }
                        )}
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log(
      "Email sent successfully to:",
      process.env.OWNER_EMAIL || process.env.SMTP_USER
    );
  } catch (error) {
    console.error("Background email sending error:", error);
  }
}

/* ─── POST handler ───────────────────────────────── */
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

    // Send email in background (fire and forget) - this doesn't block the response
    sendEmailAsync(name, email, subject, message);

    // Return success immediately to the user
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
