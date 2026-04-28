// app/api/detect-country/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  try {
    // This API will be called from client-side
    // It returns the server's best guess of user's country

    const headersList = await headers();

    const headersToCheck = [
      "cf-ipcountry",
      "x-vercel-ip-country",
      "cloudfront-viewer-country",
      "x-country",
      "x-geo-country",
    ];

    for (const header of headersToCheck) {
      const value = headersList.get(header);
      if (value && value.length === 2) {
        return NextResponse.json({
          country: value,
          source: header,
          success: true,
        });
      }
    }

    return NextResponse.json({ country: null, source: null, success: false });
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
