import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { Chatbot } from "@/components/chatbot/chatbot";
import { Footer } from "@/components/footer/footer";
import { RevealObserver } from "@/components/layout/reveal-observer";
import { Navbar } from "@/components/navigation/navbar";
import { JsonLd } from "@/components/ui/json-ld";
import { site } from "@/lib/site";
import { organizationSchema, websiteSchema } from "@/lib/structured-data/schemas";
import "./globals.css";

/* Display face: Gobold is specified by the brand guide but no licensed web font was supplied.
   Oswald (SIL OFL) is the closest condensed stand-in; swap this one declaration once Gobold is licensed. */
const oswald = localFont({
  src: "./fonts/Oswald-Variable.woff2",
  variable: "--font-oswald",
  weight: "200 700",
  display: "swap",
  fallback: ["Arial Narrow", "sans-serif"],
});

const openSans = localFont({
  src: "./fonts/OpenSans-Variable.woff2",
  variable: "--font-open-sans",
  weight: "300 800",
  display: "swap",
  fallback: ["Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Customs Wise | Keeping customs simple", template: "%s | Customs Wise" },
  description: site.description,
  applicationName: site.name,
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a3542",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${oswald.variable} ${openSans.variable}`}>
      <body>
        <a
          href="#main"
          className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-brand bg-cargo px-4 py-2.5 font-bold text-overnight transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <Navbar />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <Chatbot />
        <RevealObserver />
        {/* Google Analytics 4: one site-wide installation. Measurement ID G-LX1VK5QT45. */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-LX1VK5QT45" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-LX1VK5QT45');
          `}
        </Script>
        {/* Leadinfo: one site-wide installation. The vendor's snippet, unchanged; it loads https://cdn.leadinfo.net/ping.js.
            The id must not be "leadinfo": an element id becomes a global of the same name, and the snippet skips itself if window.leadinfo exists. */}
        <Script id="leadinfo-tracking" strategy="afterInteractive">
          {`
            (function(l,e,a,d,i,n,f,o){if(!l[i]){l.GlobalLeadinfoNamespace=l.GlobalLeadinfoNamespace||[];
            l.GlobalLeadinfoNamespace.push(i);l[i]=function(){(l[i].q=l[i].q||[]).push(arguments)};l[i].t=l[i].t||n;
            l[i].q=l[i].q||[];o=e.createElement(a);f=e.getElementsByTagName(a)[0];o.async=1;o.src=d;f.parentNode.insertBefore(o,f);}
            }(window,document,'script','https://cdn.leadinfo.net/ping.js','leadinfo','LI-6863FDC52AD22'));
          `}
        </Script>
      </body>
    </html>
  );
}
