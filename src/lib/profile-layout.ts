import type { CSSProperties } from "react";

import { AA_TEXT, contrastRatio, ensureContrast, mix, readableOn, WHITE, type Hex } from "@/lib/color";

/**
 * "Your space" layout: which blocks show and in what order, plus the owner's
 * colors and style. Stored as JSON in profiles.layout and validated by
 * src/lib/profile-layout-schema.ts (app) and is_valid_layout() (database).
 */

export const BLOCK_TYPES = ["about", "top8", "song", "nowPlaying", "pinned", "photos", "links", "wall", "drops"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export interface LayoutBlock {
  type: BlockType;
  visible: boolean;
}

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

export function fontFamily(font: FontId): string {
  return FONT_VARIABLES[font];
}

export const CARD_SHAPES = ["rounded", "sharp"] as const;
export type CardShape = (typeof CARD_SHAPES)[number];

export const CARD_STYLES = ["flat", "outlined", "shadow"] as const;
export type CardStyle = (typeof CARD_STYLES)[number];

export const BACKDROPS = ["solid", "pattern", "photo"] as const;
export type BackdropKind = (typeof BACKDROPS)[number];

export const PATTERNS = ["dots", "grid", "diagonal", "checks"] as const;
export type PatternId = (typeof PATTERNS)[number];

export interface SpaceColors {
  accent: Hex;
  background: Hex;
  card: Hex;
  text: Hex;
}

export const COLOR_ROLES = ["accent", "background", "card", "text"] as const satisfies readonly (keyof SpaceColors)[];

export interface ProfileLayout {
  blocks: LayoutBlock[];
  /** `null` keeps the site's colors (follows light/dark mode). */
  colors: SpaceColors | null;
  font: FontId;
  cardShape: CardShape;
  cardStyle: CardStyle;
  backdrop: { kind: BackdropKind; pattern: PatternId; photoPath: string | null };
  links: { label: string; url: string }[];
  /** Storage paths in the owner's folder. */
  photos: string[];
  pinnedPostId: string | null;
  nowPlaying: { kind: "listening" | "watching"; text: string; url: string | null } | null;
}

export const MAX_LINKS = 6;
export const MAX_PHOTOS = 9;

const DEFAULT_VISIBLE = new Set<BlockType>(["about", "top8", "song", "wall", "drops"]);

export const DEFAULT_LAYOUT: ProfileLayout = {
  blocks: BLOCK_TYPES.map((type) => ({ type, visible: DEFAULT_VISIBLE.has(type) })),
  colors: null,
  font: "sans",
  cardShape: "rounded",
  cardStyle: "shadow",
  backdrop: { kind: "solid", pattern: "dots", photoPath: null },
  links: [],
  photos: [],
  pinnedPostId: null,
  nowPlaying: null,
};

/** Starting colors when someone first switches to custom colors. */
export const STARTER_COLORS: SpaceColors = {
  accent: "#db2777",
  background: "#fdf2f8",
  card: "#ffffff",
  text: "#15151a",
};

/** Quick picks shown next to each color picker (any color can still be chosen). */
export const COLOR_PRESETS: Record<keyof SpaceColors, Hex[]> = {
  accent: ["#6d28d9", "#db2777", "#dc2626", "#b45309", "#15803d", "#0f766e", "#1d4ed8", "#18181b"],
  background: ["#f6f6f8", "#fdf2f8", "#ecfdf5", "#eff6ff", "#fefce8", "#f5f3ff", "#0c0c10", "#1a0f15"],
  card: ["#ffffff", "#fafaf9", "#fff7ed", "#f0f9ff", "#16161c", "#1f1f27"],
  text: ["#15151a", "#27272a", "#3f3f46", "#ececf1", "#ffffff"],
};

/** Every block type exactly once, in the saved order; new types appear hidden at the end. */
export function withAllBlocks(blocks: LayoutBlock[]): LayoutBlock[] {
  const seen = new Set<BlockType>();
  const ordered = blocks.filter((block) => !seen.has(block.type) && seen.add(block.type));
  return [...ordered, ...BLOCK_TYPES.filter((type) => !seen.has(type)).map((type) => ({ type, visible: false }))];
}

/** A contrast problem between two of the owner's colors. */
export interface ContrastIssue {
  role: "text" | "accent";
  against: "card" | "background";
  ratio: number;
  needed: number;
}

export function contrastIssues(colors: SpaceColors): ContrastIssue[] {
  const checks: Omit<ContrastIssue, "ratio">[] = [
    { role: "text", against: "card", needed: AA_TEXT },
    { role: "text", against: "background", needed: AA_TEXT },
    // Accent is also small label text, so it gets the full text ratio.
    { role: "accent", against: "card", needed: AA_TEXT },
  ];
  return checks.flatMap((check) => {
    const ratio = contrastRatio(colors[check.role], colors[check.against]);
    return ratio < check.needed ? [{ ...check, ratio }] : [];
  });
}

/** Adjusts text and accent just enough to pass every check. */
export function fixContrast(colors: SpaceColors): SpaceColors {
  let text = ensureContrast(colors.text, colors.card, AA_TEXT);
  text = ensureContrast(text, colors.background, AA_TEXT);
  return { ...colors, text, accent: ensureContrast(colors.accent, colors.card, AA_TEXT) };
}

function patternImage(pattern: PatternId): string {
  const shapes: Record<PatternId, string> = {
    dots: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle cx="2" cy="2" r="1.5" fill="#808080" fill-opacity=".22"/></svg>',
    grid: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M24 0H0v24" fill="none" stroke="#808080" stroke-opacity=".16"/></svg>',
    diagonal: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"><path d="M-2 16 16-2" stroke="#808080" stroke-opacity=".16" stroke-width="2"/></svg>',
    checks: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M0 0h16v16H0zM16 16h16v16H16z" fill="#808080" fill-opacity=".07"/></svg>',
  };
  return `url("data:image/svg+xml,${encodeURIComponent(shapes[pattern])}")`;
}

/** Light/dark values of the status tokens in globals.css, re-checked against custom card colors. */
const STATUS_COLORS: Record<"online" | "success" | "danger" | "upvote" | "downvote", { light: Hex; dark: Hex }> = {
  online: { light: "#15803d", dark: "#4ade80" },
  success: { light: "#15803d", dark: "#4ade80" },
  danger: { light: "#dc2626", dark: "#f87171" },
  upvote: { light: "#c2410c", dark: "#fb923c" },
  downvote: { light: "#4f46e5", dark: "#818cf8" },
};

const CARD_SHADOW = "0 2px 10px rgb(0 0 0 / 0.08)";

/**
 * Re-points the design tokens inside a space at the owner's choices. Solid
 * colors only; patterns are tiny SVG shapes, never gradients.
 */
export function spaceStyle(layout: ProfileLayout, backdropUrl: string | null): CSSProperties {
  const style: CSSProperties = {
    "--profile-font": fontFamily(layout.font),
    "--card-radius": layout.cardShape === "sharp" ? "0.25rem" : "1.125rem",
  };

  if (layout.colors) {
    const { accent, background, card, text } = layout.colors;
    const border = mix(text, card, 0.14);
    const accentSoft = mix(accent, card, 0.1);
    Object.assign(style, {
      // Tag chips put accent text on the soft tint, so keep it readable there too.
      "--accent": ensureContrast(accent, accentSoft),
      "--accent-hover": mix(text, accent, 0.2),
      "--accent-soft": accentSoft,
      "--on-accent": readableOn(accent),
      "--bg": background,
      "--surface": card,
      "--surface-muted": mix(text, card, 0.06),
      "--border": border,
      "--text": text,
      "--text-muted": ensureContrast(mix(text, card, 0.7), card),
    });
    style["--card-outline"] = border;
    // Form controls follow the owner's card; status colors are re-derived so they stay readable on it.
    const dark = readableOn(card) === WHITE;
    style.colorScheme = dark ? "dark" : "light";
    for (const [name, pair] of Object.entries(STATUS_COLORS)) {
      style[`--${name}`] = ensureContrast(dark ? pair.dark : pair.light, card);
    }
  }

  if (layout.cardStyle === "flat") style["--card-outline"] = "transparent";
  style["--card-shadow"] = layout.cardStyle === "shadow" ? CARD_SHADOW : "none";

  if (layout.backdrop.kind === "pattern") {
    style.backgroundImage = patternImage(layout.backdrop.pattern);
  } else if (layout.backdrop.kind === "photo" && backdropUrl) {
    style.backgroundImage = `url("${backdropUrl}")`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }
  return style;
}
