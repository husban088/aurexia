// app/layout.tsx
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { CurrencyProvider } from "./context/CurrencyContext";
import { Suspense } from "react";

// Poppins font configuration
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Tech4U | Luxury in Every Detail",
  description: "Tech4U — Luxury in Every Detail.",
  icons: { icon: "/icon.jpg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <CurrencyProvider>
          <Providers>{children}</Providers>
        </CurrencyProvider>
      </body>
    </html>
  );
}
