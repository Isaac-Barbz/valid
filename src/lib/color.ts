/** Small hex-color helpers for user-picked colors and WCAG contrast checks. */

export type Hex = `#${string}`;

const HEX = /^#[0-9a-f]{6}$/;

const BLACK: Hex = "#000000";
export const WHITE: Hex = "#ffffff";

/** WCAG AA for normal text. */
export const AA_TEXT = 4.5;

export function isHex(value: string): value is Hex {
  return HEX.test(value);
}

function channels(hex: Hex): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex([r, g, b]: [number, number, number]): Hex {
  return `#${[r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: Hex): number {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: Hex, b: Hex): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** `amount` of `a` mixed into `b` (0–1). */
export function mix(a: Hex, b: Hex, amount: number): Hex {
  const [ca, cb] = [channels(a), channels(b)];
  return toHex([0, 1, 2].map((i) => ca[i] * amount + cb[i] * (1 - amount)) as [number, number, number]);
}

/** Black or white, whichever reads better on `background`. */
export function readableOn(background: Hex): Hex {
  return contrastRatio(BLACK, background) >= contrastRatio(WHITE, background) ? BLACK : WHITE;
}

/**
 * Nudges `foreground` toward black or white (whichever the background needs)
 * until it reaches `ratio` against `background`. Returns it unchanged if it
 * already passes.
 */
export function ensureContrast(foreground: Hex, background: Hex, ratio = AA_TEXT): Hex {
  if (contrastRatio(foreground, background) >= ratio) return foreground;
  const target = readableOn(background);
  for (let step = 1; step <= 20; step++) {
    const candidate = mix(target, foreground, step / 20);
    if (contrastRatio(candidate, background) >= ratio) return candidate;
  }
  return target;
}
