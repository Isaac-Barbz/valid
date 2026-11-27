import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { DemoBanner } from "@/components/demo-banner";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Valid", template: "%s · Valid" },
  description: "A modern place to talk about anything, as yourself or anonymously.",
};

export const viewport: Viewport = {
  // Matches the --surface token in globals.css (metadata cannot read CSS variables).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#16161c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <DemoBanner />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
