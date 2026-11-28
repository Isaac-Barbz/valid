import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fraunces, Inter, Nunito, Space_Mono } from "next/font/google";

import { DemoBanner } from "@/components/demo-banner";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SideRail } from "@/components/side-rail";
import { SiteHeader } from "@/components/site-header";
import { TERMS } from "@/lib/copy";
import { ROW_BOOT_SCRIPT } from "@/lib/community-prefs";
import { DEFAULT_LOOK, LOOK_BOOT_SCRIPT } from "@/lib/personal-look";

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
  // Dark --surface token from globals.css (dark is the default look; metadata cannot read CSS variables).
  themeColor: "#131317",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The boot script sets data-theme/density/accent from localStorage before hydration.
    <html lang="en" className={`${fontVariables} h-full antialiased`} data-theme={DEFAULT_LOOK.theme} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOOK_BOOT_SCRIPT + ROW_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] font-sans md:pb-0 md:pl-rail">
        <SideRail />
        <DemoBanner />
        <SiteHeader />
        {children}
        <MobileTabBar />
      </body>
    </html>
  );
}
