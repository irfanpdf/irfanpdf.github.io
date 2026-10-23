import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HashScroller } from "@/components/hash-scroller";
import { ChatWidget } from "@/components/chat-widget";
import { SITE } from "@/data/site";
import { SITE_URL } from "@/data/env";

const DESCRIPTION =
  "Irfan PDF is a free Windows desktop application for viewing, editing, converting, OCR, searching, comparing, printing and securing PDF documents. All work happens offline on your own computer.";

/** Applied before first paint: stored theme, else OS preference. */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("ipdf-site-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.style.colorScheme=t;}catch(e){}})();`;

export const metadata: Metadata = {
  title: {
    default: "Irfan PDF — Your Documents. Your Control.",
    template: "%s · Irfan PDF",
  },
  description: DESCRIPTION,
  applicationName: "Irfan PDF",
  authors: [{ name: SITE.publisher }],
  keywords: [
    "PDF editor Windows",
    "offline OCR PDF",
    "searchable OCR",
    "editable OCR",
    "PDF to Word",
    "PDF to Excel",
    "compress PDF",
    "merge split PDF",
    "redact PDF",
    "local PDF tools no upload",
  ],
  // metadataBase only: canonical URLs are declared per page via
  // canonicalFor() so no page can inherit the wrong one.
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  openGraph: {
    type: "website",
    siteName: "Irfan PDF",
    title: "Irfan PDF — Your Documents. Your Control.",
    description: DESCRIPTION,
    ...(SITE_URL
      ? {
          url: "/",
          images: [{ url: "/screenshots/home.png", width: 1440, height: 900, alt: "Irfan PDF dashboard" }],
        }
      : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "Irfan PDF — Your Documents. Your Control.",
    description: DESCRIPTION,
    ...(SITE_URL ? { images: ["/screenshots/home.png"] } : {}),
  },
  // Always indexable: an unconfigured build omits canonical/OG/sitemap URLs
  // (no guessed domain), but must never silently ship noindex.
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1016" },
  ],
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Irfan PDF",
  applicationCategory: "BusinessApplication",
  operatingSystem: SITE.os,
  softwareVersion: SITE.version,
  datePublished: SITE.releaseDate,
  description: DESCRIPTION,
  publisher: { "@type": "Organization", name: SITE.publisher },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  ...(SITE_URL ? { url: SITE_URL } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body className="antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <HashScroller />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <ChatWidget />
      </body>
    </html>
  );
}
