import type { Metadata } from "next";
import { Bree_Serif, Figtree } from "next/font/google";
import "./globals.css";
import "@/lib/env";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const breeSerif = Bree_Serif({
  subsets: ["latin"],
  weight: ["400"],  // single-axis font — only valid weight
  variable: "--font-bree-serif",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "600"],  // collapsed from 400/500/600/700 per UI-SPEC §Typography Contract
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zeremi.app"),
  title: {
    template: "%s | Zeremi",
    default: "Zeremi — AI Marketing for Solopreneurs",
  },
  description: "Strategy-first AI marketing for solopreneurs and small teams. Join the waitlist.",
  openGraph: {
    type: "website",
    url: "https://zeremi.app",
    siteName: "Zeremi",
    locale: "en_US",
    // og:image auto-provided by app/opengraph-image.tsx file convention
    // Do NOT set openGraph.images here — causes Pitfall 6 (duplicate og:image tags)
  },
  twitter: {
    card: "summary_large_image",
    // twitter:image auto-inherited from opengraph-image.tsx
    // Omit twitter:creator/twitter:site — no public X handle yet
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${breeSerif.variable} ${figtree.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
