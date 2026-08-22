import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import RootClientShell from "@/components/layout/RootClientShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";
const SITE_TITLE = "Riskyc Fashion – Style That Speaks";
const SITE_DESCRIPTION =
  "Discover the latest fashion dresses, jerseys, and more at Riskyc Fashion. Quality, style, and elegance delivered to your door.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Pages with their own generateMetadata (products, categories) already return a
  // complete "X – Riskyc Fashion" title, so no template here — that would double it up.
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: "fashion, dresses, jerseys, Cameroon, style",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Riskyc",
  },
  openGraph: {
    type: "website",
    siteName: "Riskyc Fashion",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#ff1a5e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col">
        <RootClientShell>{children}</RootClientShell>
      </body>
    </html>
  );
}
