/**
 * The curated accent palette (`--palette-*` tokens in globals.css): personal
 * accent choices in Settings and default avatar colors.
 */
export const ACCENTS = ["violet", "rose", "red", "amber", "green", "teal", "blue", "ink"] as const;
export type AccentId = (typeof ACCENTS)[number];

export function accentColor(accent: AccentId): string {
  return `var(--palette-${accent})`;
}

export function onAccentColor(accent: AccentId): string {
  return `var(--palette-${accent}-on)`;
}

/** Stable default avatar color for people without a photo. */
export function avatarAccent(username: string): AccentId {
  let hash = 2166136261;
  for (const char of username) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}
