import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fraunces, Inter, Nunito, Space_Mono } from "next/font/google";

import { DemoBanner } from "@/components/demo-banner";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SiteHeader } from "@/components/site-header";
import { TERMS } from "@/lib/copy";

import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

// Profile font choices: only downloaded on pages that use them.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], preload: false });
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400", "700"], preload: false });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], preload: false });

const fontVariables = [inter, bricolage, fraunces, spaceMono, nunito].map((font) => font.variable).join(" ");

export const metadata: Metadata = {
  title: { default: TERMS.brand, template: `%s · ${TERMS.brand}` },
  description: `A modern place to talk about anything, as yourself or ${TERMS.anonymous.label.toLowerCase()}.`,
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
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] font-sans md:pb-0">
        <DemoBanner />
        <SiteHeader />
        {children}
        <MobileTabBar />
      </body>
    </html>
  );
}
