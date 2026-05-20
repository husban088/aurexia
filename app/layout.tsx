// app/layout.tsx
import type { Metadata } from "next";
import { Poppins, Goldman } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";
import { CurrencyProvider } from "./context/CurrencyContext";
import { LanguageProvider } from "./context/LanguageContext";
import { getInitialCurrency } from "@/lib/get-initial-currency";

// ✅ Goldman — primary font for entire website
const goldman = Goldman({
  variable: "--font-goldman",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

// ✅ Poppins — kept as backup/secondary font
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Tech4U | Luxury in Every Detail",
  description: "Tech4U — Luxury in Every Detail.",
  icons: { icon: "/icon.jpg" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialCurrency = await getInitialCurrency();

  return (
    <html
      lang="en"
      dir="ltr"
      className={`${goldman.variable} ${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* ✅ DNS prefetch — Facebook pixel faster load */}
        <link rel="dns-prefetch" href="//connect.facebook.net" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* ✅ Meta Pixel */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1929542124417287');
              fbq('track', 'PageView');
            `,
          }}
        />
        {/* ✅ Fallback for browsers with JavaScript disabled */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1929542124417287&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <LanguageProvider>
          <CurrencyProvider initialCurrencyCode={initialCurrency.code}>
            <Providers>{children}</Providers>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
