/** @type {import('next').NextConfig} */
const nextConfig = {
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
      // ✅ PERF FIX: Supabase storage — add karo taake next/image optimize kar sake
      // Pehle: Supabase images unoptimized load ho rahi theen = slow + large
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
    ],
    // ✅ AVIF first (40% smaller than WebP), WebP fallback
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // ✅ PERF: Minimum cache time for optimized images (1 week)
    minimumCacheTTL: 604800,
    // ✅ PERF: Dangerous SVG — allow karo (internal Supabase SVGs safe hain)
    dangerouslyAllowSVG: false,
  },

  // ✅ PERF: Compress responses
  compress: true,

  // ✅ PERF: Power pack imports — tree shake karo
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@supabase/supabase-js",
    ],
    // ✅ PERF: Partial pre-rendering — static shell fast, dynamic parts stream
    ppr: false, // false rakho — experimental hai, production mein stable nahi
  },

  // ✅ PERF: Headers for static assets — long cache
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  transpilePackages: [],
};

module.exports = nextConfig;