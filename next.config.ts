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
    optimizePackageImports: ["next/font"],
  },
};

module.exports = nextConfig;
