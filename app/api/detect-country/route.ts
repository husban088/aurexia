// app/api/detect-country/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Edge runtime = fastest possible response (no cold start)
export const runtime = "edge";

// ✅ No caching — VPN change pe fresh detection chahiye
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const headersList = await headers();

    // Priority order — most reliable first
    const headersToCheck = [
      "cf-ipcountry", // Cloudflare (most accurate)
      "x-vercel-ip-country", // Vercel Edge
      "cloudfront-viewer-country", // AWS CloudFront
      "x-country", // Generic CDN
      "x-geo-country", // Other CDNs
      "x-real-country", // Some proxies
    ];

    for (const header of headersToCheck) {
      const value = headersList.get(header);
      // "XX" = unknown, "T1" = Tor network — skip these
      if (value && value.length === 2 && value !== "XX" && value !== "T1") {
        console.log("📍 Country detected from " + header + ":", value);
        return NextResponse.json(
          { country: value.toUpperCase(), source: header, success: true },
          {
            headers: {
              // ✅ No cache — VPN change pe naya country milega
              "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
              "CDN-Cache-Control": "no-store",
              Pragma: "no-cache",
            },
          }
        );
      }
    }

    // No geo headers found — client JS APIs will take over
    return NextResponse.json(
      {
        country: null,
        source: null,
        success: false,
        message: "No geo headers found — client will detect via IP APIs",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Error detecting country:", error);
    return NextResponse.json(
      {
        country: null,
        source: null,
        success: false,
        error: "Detection failed",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
