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

export const metadata: Metadata = {
  title: "Riskyc Fashion – Style That Speaks",
  description:
    "Discover the latest fashion dresses, jerseys, and more at Riskyc Fashion. Quality, style, and elegance delivered to your door.",
  keywords: "fashion, dresses, jerseys, Cameroon, style",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Riskyc",
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
