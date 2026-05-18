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
    ],
  },
  // Font optimization
  optimizeFonts: true,
  // Suppress unused preload warnings for fonts loaded via CSS variables
  experimental: {
    optimizePackageImports: ["next/font", "@next/font"],
  },
  // Add transpilePackages if needed
  transpilePackages: [],
  // ✅ Force full reload on navigation (fixes Chrome back/forward issues)
  // This prevents bfcache (back-forward cache) which causes old content to show
  crossOrigin: "anonymous",
};

module.exports = nextConfig;
