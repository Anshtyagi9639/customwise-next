import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
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
      </body>
    </html>
  );
}
