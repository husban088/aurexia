// app/layout.tsx
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";
import { CurrencyProvider } from "./context/CurrencyContext";
import { LanguageProvider } from "./context/LanguageContext";
// import { CurrencyCleaner } from "./components/CurrencyCleaner";
import { getInitialCurrency } from "@/lib/get-initial-currency";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side currency detect — Cloudflare/Vercel CDN headers se
  // Yeh page render hone se pehle hota hai — koi flash nahi
  const initialCurrency = await getInitialCurrency();

  return (
    <html
      lang="en"
      dir="ltr"
      className={`${poppins.variable} h-full antialiased`}
    >
      <head>
        {/* ===== Meta Pixel Code ===== */}
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
        {/* Noscript fallback for Meta Pixel */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1929542124417287&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* ===== End Meta Pixel Code ===== */}
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          {/*
            initialCurrencyCode — server se detected country ka currency code
            CurrencyCleaner — purana galat localStorage (auto-saved USD) clear karta hai
          */}
          <CurrencyProvider initialCurrencyCode={initialCurrency.code}>
            {/* <CurrencyCleaner /> */}
            <Providers>{children}</Providers>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
