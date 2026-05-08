// ============================================
// 🔍 TECH4U — WhatsApp Diagnostic Tool
// Run: node diagnose-whatsapp.mjs
//
// Yeh script Green API instance check karega aur
// Australia, UK, USA, Pakistan ke numbers test karega
// ============================================

const INSTANCE_ID = "7107607433";
const API_TOKEN = "816fd1f04620400396db8f12f5ca3345258a991057d146e4be";
const BASE_URL = `https://api.green-api.com/waInstance${INSTANCE_ID}`;

// ============================================
// TEST NUMBERS — Sirf apne asli numbers daalo
// ============================================
const TEST_NUMBERS = {
  pakistan: "+923001234567", // ← Apna Pakistani test number daalo
  australia: "+61412345678", // ← Australian test number (agar koi hai)
  uk: "+447123456789", // ← UK test number
  usa: "+12125551234", // ← USA test number
};

// ============================================
// STEP 1: Instance State Check
// ============================================
async function checkInstanceState() {
  console.log("\n🔍 STEP 1: Checking Green API Instance State...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const res = await fetch(`${BASE_URL}/getStateInstance/${API_TOKEN}`);
    const data = await res.json();

    console.log("Instance ID:", INSTANCE_ID);
    console.log("Raw response:", JSON.stringify(data, null, 2));

    if (data.stateInstance === "authorized") {
      console.log("✅ STATUS: AUTHORIZED — WhatsApp linked and working");
    } else if (data.stateInstance === "notAuthorized") {
      console.log("❌ STATUS: NOT AUTHORIZED — WhatsApp scan required!");
      console.log("   → Go to: https://console.green-api.com/instanceList");
      console.log("   → Click your instance → Scan QR code with your phone");
    } else if (data.stateInstance === "blocked") {
      console.log("🔴 STATUS: BLOCKED — WhatsApp account banned/blocked");
    } else {
      console.log("⚠️  STATUS:", data.stateInstance || "Unknown");
    }

    return data.stateInstance === "authorized";
  } catch (err) {
    console.log("❌ FETCH ERROR:", err.message);
    return false;
  }
}

// ============================================
// STEP 2: Check Account Settings
// ============================================
async function checkAccountSettings() {
  console.log("\n🔍 STEP 2: Checking Account Settings...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const res = await fetch(`${BASE_URL}/getSettings/${API_TOKEN}`);
    const data = await res.json();

    console.log("Settings:", JSON.stringify(data, null, 2));

    // Check if international messaging is enabled
    if (data.outgoingMessageWebhook !== undefined) {
      console.log("✅ webhookUrl configured:", data.webhookUrl || "None");
    }

    return data;
  } catch (err) {
    console.log("❌ Settings fetch error:", err.message);
    return null;
  }
}

// ============================================
// STEP 3: Check if a number exists on WhatsApp
// ============================================
async function checkNumberExists(phone) {
  const clean = phone.replace(/[\s\-\(\)\+]/g, "");
  const chatId = `${clean}@c.us`;

  try {
    const res = await fetch(`${BASE_URL}/checkWhatsapp/${API_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: clean }),
    });
    const data = await res.json();

    return { chatId, exists: data.existsWhatsapp, raw: data };
  } catch (err) {
    return { chatId, exists: null, error: err.message };
  }
}

// ============================================
// STEP 4: Send actual test message
// ============================================
async function sendTestMessage(phone, countryName) {
  const clean = phone.replace(/[\+]/g, "");
  const chatId = `${clean}@c.us`;

  console.log(`\n📤 Sending to ${countryName}: ${phone}`);
  console.log(`   chatId: ${chatId}`);

  try {
    const res = await fetch(`${BASE_URL}/sendMessage/${API_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId,
        message: `✅ Tech4U Test Message\n\nHello from Pakistan! This is a test notification from Tech4U store.\n\nCountry: ${countryName}\nTime: ${new Date().toISOString()}\n\nIf you received this, international WhatsApp delivery is working! 🎉`,
      }),
    });

    const data = await res.json();

    if (data.idMessage) {
      console.log(`   ✅ SENT SUCCESSFULLY! Message ID: ${data.idMessage}`);
      console.log(
        `   → Now check WhatsApp on ${countryName} number for delivery status`,
      );
      return true;
    } else {
      console.log(`   ❌ FAILED:`, JSON.stringify(data));

      // Diagnose specific errors
      if (data.statusCode === 400 || data.code === 400) {
        console.log(
          `   → Error 400: chatId format wrong. Try: ${clean.replace(/^0/, "92")}@c.us`,
        );
      }
      if (data.statusCode === 466) {
        console.log(
          `   → Error 466: Rate limit hit — wait 30 seconds and retry`,
        );
      }
      if (data.message?.includes("not authorized")) {
        console.log(
          `   → Not Authorized: Scan QR code again at console.green-api.com`,
        );
      }
      return false;
    }
  } catch (err) {
    console.log(`   ❌ NETWORK ERROR:`, err.message);
    return false;
  }
}

// ============================================
// MAIN RUNNER
// ============================================
async function runDiagnostics() {
  console.log("\n🚀 TECH4U WhatsApp Diagnostic Tool");
  console.log("====================================");
  console.log("Instance:", INSTANCE_ID);
  console.log("Time:", new Date().toLocaleString());

  // Step 1: Check instance
  const isAuthorized = await checkInstanceState();

  if (!isAuthorized) {
    console.log("\n🔴 INSTANCE NOT AUTHORIZED — Fix this first!");
    console.log("   1. Go to: https://console.green-api.com/instanceList");
    console.log("   2. Click instance 7107607433");
    console.log("   3. Click 'Scan QR' button");
    console.log(
      "   4. Open WhatsApp on your phone → Settings → Linked Devices → Link Device",
    );
    console.log("   5. Scan the QR code");
    console.log("   6. Run this diagnostic again\n");
    return;
  }

  // Step 2: Check settings
  await checkAccountSettings();

  // Step 3: Check which numbers have WhatsApp
  console.log("\n🔍 STEP 3: Checking Which Numbers Are on WhatsApp...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (const [country, phone] of Object.entries(TEST_NUMBERS)) {
    // Skip placeholder numbers
    if (phone.includes("1234567")) {
      console.log(
        `⚠️  ${country.toUpperCase()}: Placeholder number — add real test number`,
      );
      continue;
    }

    const result = await checkNumberExists(phone);

    if (result.exists === true) {
      console.log(
        `✅ ${country.toUpperCase()} ${phone}: HAS WhatsApp → Will receive messages`,
      );
    } else if (result.exists === false) {
      console.log(
        `❌ ${country.toUpperCase()} ${phone}: NO WhatsApp → Cannot receive`,
      );
      console.log(
        `   → This is why "not delivered" appears — number not on WhatsApp`,
      );
    } else {
      console.log(
        `⚠️  ${country.toUpperCase()} ${phone}: Check failed → ${result.error || JSON.stringify(result.raw)}`,
      );
    }

    // Small delay between requests
    await new Promise((r) => setTimeout(r, 500));
  }

  // Step 4: Try sending test messages (only to non-placeholder numbers)
  console.log("\n🔍 STEP 4: Sending Test Messages...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (const [country, phone] of Object.entries(TEST_NUMBERS)) {
    if (phone.includes("1234567")) {
      console.log(
        `⚠️  ${country.toUpperCase()}: Skipped — add real number to TEST_NUMBERS above`,
      );
      continue;
    }
    await sendTestMessage(phone, country);
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Summary
  console.log("\n📊 SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Common reasons for 'not delivered' in Australia/UK/USA:");
  console.log("");
  console.log("1. ❌ Phone number NOT on WhatsApp");
  console.log("   → Customer gives landline or non-WhatsApp mobile");
  console.log("   → FIX: Add note in checkout 'Must be WhatsApp number'");
  console.log("");
  console.log("2. ❌ Green API instance disconnected");
  console.log("   → WhatsApp gets logged out after ~14 days inactive");
  console.log("   → FIX: Re-scan QR at console.green-api.com");
  console.log("");
  console.log("3. ❌ WhatsApp spam filter");
  console.log(
    "   → Sending too many messages from Pakistan to foreign numbers",
  );
  console.log("   → FIX: Upgrade Green API plan or use WhatsApp Business API");
  console.log("");
  console.log("4. ✅ Phone format is CORRECT in your code");
  console.log("   → +61412345678 → 61412345678@c.us ✅");
  console.log("   → +447123456789 → 447123456789@c.us ✅");
  console.log("   → +12125551234 → 12125551234@c.us ✅");
}

runDiagnostics().catch(console.error);
