import type { Metadata } from "next";
import { Quicksand, Figtree } from "next/font/google";
import "./globals.css";
import "@/lib/env";
import { Toaster } from "@/components/ui/sonner";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://useQuibly.com"),
  title: {
    template: "%s | Quibly",
    default: "Quibly — AI Marketing for Solopreneurs",
  },
  description: "Strategy-first AI marketing for solopreneurs and small teams. Join the waitlist.",
  openGraph: {
    type: "website",
    url: "https://useQuibly.com",
    siteName: "Quibly",
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
      className={`${quicksand.variable} ${figtree.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
