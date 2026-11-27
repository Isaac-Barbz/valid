import type { CSSProperties } from "react";

/**
 * The curated, solid-color choices people can make for their profile page.
 * Values are ids; the actual colors live as tokens in globals.css
 * (`--palette-*`, `--page-*`) so they adapt to light and dark mode.
 * Keep these lists in sync with the check constraints in
 * supabase/migrations/20261127000000_profiles.sql.
 */

export const ACCENTS = ["violet", "rose", "red", "amber", "green", "teal", "blue", "ink"] as const;
export type AccentId = (typeof ACCENTS)[number];

export const BACKGROUNDS = ["plain", "blush", "mint", "sky", "butter", "lilac", "stone"] as const;
export type BackgroundId = (typeof BACKGROUNDS)[number];

export const FONTS = ["sans", "display", "serif", "mono", "rounded"] as const;
export type FontId = (typeof FONTS)[number];

export const FONT_LABELS: Record<FontId, string> = {
  sans: "Clean",
  display: "Bold",
  serif: "Classic",
  mono: "Typewriter",
  rounded: "Soft",
};

/** CSS variables set by next/font in the root layout. */
const FONT_VARIABLES: Record<FontId, string> = {
  sans: "var(--font-inter)",
  display: "var(--font-bricolage)",
  serif: "var(--font-fraunces)",
  mono: "var(--font-space-mono)",
  rounded: "var(--font-nunito)",
};

export interface ProfileTheme {
  accent: AccentId;
  background: BackgroundId;
  font: FontId;
}

export const DEFAULT_THEME: ProfileTheme = { accent: "violet", background: "plain", font: "sans" };

/** Swatch color for a picker or a default avatar. */
export function accentColor(accent: AccentId): string {
  return `var(--palette-${accent})`;
}

export function onAccentColor(accent: AccentId): string {
  return `var(--palette-${accent}-on)`;
}

export function backgroundColor(background: BackgroundId): string {
  return `var(--page-${background})`;
}

export function fontFamily(font: FontId): string {
  return FONT_VARIABLES[font];
}

/** Re-points the design tokens inside a profile page at the owner's choices. */
export function themeStyle(theme: ProfileTheme): CSSProperties {
  return {
    "--accent": accentColor(theme.accent),
    "--accent-hover": `var(--palette-${theme.accent}-strong)`,
    "--accent-soft": `var(--palette-${theme.accent}-soft)`,
    "--on-accent": onAccentColor(theme.accent),
    "--bg": backgroundColor(theme.background),
    "--profile-font": fontFamily(theme.font),
  };
}

/** Stable default avatar color for people without a photo. */
export function avatarAccent(username: string): AccentId {
  let hash = 2166136261;
  for (const char of username) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}
