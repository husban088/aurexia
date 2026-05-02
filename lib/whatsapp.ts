// lib/whatsapp.ts
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  type BaileysEventMap,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode-terminal";

let sock: any = null;
let isConnected = false;

export async function connectWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ["Tech4U", "Chrome", "1.0.0"],
  });

  sock.ev.on(
    "connection.update",
    (update: BaileysEventMap["connection.update"]) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("📱 Scan this QR code with WhatsApp:");
        QRCode.generate(qr, { small: true });
      }

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;
        console.log(
          "WhatsApp connection closed due to",
          lastDisconnect?.error,
          ", reconnecting",
          shouldReconnect
        );
        if (shouldReconnect) {
          connectWhatsApp();
        }
      } else if (connection === "open") {
        isConnected = true;
        console.log("✅ WhatsApp connected successfully!");
      }
    }
  );

  sock.ev.on("creds.update", saveCreds);

  return sock;
}

export async function sendWhatsAppMessage(to: string, message: string) {
  if (!sock || !isConnected) {
    console.log("WhatsApp not connected, connecting...");
    await connectWhatsApp();
    // Wait for connection
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Format phone number (remove + and spaces)
  let formattedNumber = to.replace(/\s/g, "").replace("+", "");

  // Add @s.whatsapp.net suffix
  const jid = `${formattedNumber}@s.whatsapp.net`;

  try {
    const result = await sock.sendMessage(jid, { text: message });
    console.log("✅ WhatsApp message sent to:", to);
    return result;
  } catch (error) {
    console.error("❌ Failed to send WhatsApp message:", error);
    throw error;
  }
}

export async function sendOrderWhatsApp(
  phoneNumber: string,
  orderNumber: string,
  name: string,
  total: number,
  items: any[]
) {
  // Format phone number (remove spaces and special chars)
  let cleanNumber = phoneNumber.replace(/\s/g, "").replace("+", "");

  // Ensure it starts with country code (default to +92 if not present)
  if (
    !cleanNumber.startsWith("92") &&
    !cleanNumber.startsWith("1") &&
    !cleanNumber.startsWith("44")
  ) {
    // Add +92 for Pakistan numbers if no country code
    if (cleanNumber.startsWith("3")) {
      cleanNumber = `92${cleanNumber}`;
    }
  }

  const itemsList = items
    .map(
      (item) =>
        `• ${item.name}${item.variant ? ` (${item.variant})` : ""} x${
          item.quantity
        } = PKR ${item.price.toLocaleString()}`
    )
    .join("\n");

  const message = `🛍️ *TECH4U - Order Confirmation*
    
  Dear ${name},
  
  ✅ Your order has been confirmed!
  
  📦 *Order Number:* ${orderNumber}
  💰 *Total Amount:* PKR ${total.toLocaleString()}
  
  *Order Items:*
  ${itemsList}
  
  🔗 Track your order: ${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}
  
  Thank you for shopping with Tech4U! ✨`;

  return sendWhatsAppMessage(cleanNumber, message);
}
