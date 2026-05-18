import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Suppress unused preload warnings for fonts loaded via CSS variables
  experimental: {
    optimizePackageImports: ["next/font", "@next/font"],
  },
  // ✅ Force full reload on navigation (fixes Chrome back/forward issues)
  crossOrigin: "anonymous",
};

export default nextConfig;
