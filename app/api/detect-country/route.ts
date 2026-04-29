// app/api/detect-country/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  try {
    const headersList = await headers();

    // Priority order of headers
    const headersToCheck = [
      "cf-ipcountry", // Cloudflare
      "x-vercel-ip-country", // Vercel
      "cloudfront-viewer-country", // AWS CloudFront
      "x-country", // Custom
      "x-geo-country", // Custom
    ];

    for (const header of headersToCheck) {
      const value = headersList.get(header);
      if (value && value.length === 2) {
        console.log(`📍 Server detected country from ${header}:`, value);
        return NextResponse.json({
          country: value,
          source: header,
          success: true,
        });
      }
    }

    // If no headers, we can still return a default
    // Client will detect using IP APIs
    return NextResponse.json({
      country: null,
      source: null,
      success: false,
      message: "No geo headers found, client will detect",
    });
  } catch (error) {
    console.error("Error detecting country:", error);
    return NextResponse.json({
      country: null,
      source: null,
      success: false,
      error: "Failed to detect country",
    });
  }
}
