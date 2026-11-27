import "server-only";

import { z } from "zod";

import { isHex } from "@/lib/color";
import {
  BACKDROPS,
  BLOCK_TYPES,
  CARD_SHAPES,
  CARD_STYLES,
  DEFAULT_LAYOUT,
  FONTS,
  fixContrast,
  MAX_LINKS,
  MAX_PHOTOS,
  PATTERNS,
  withAllBlocks,
  type ProfileLayout,
} from "@/lib/profile-layout";

/**
 * Validation for profiles.layout. Reading is forgiving (bad or missing parts
 * fall back to defaults); saving is strict. Mirrors is_valid_layout() in SQL.
 */

const hex = z.string().toLowerCase().refine(isHex, "Colors must be hex like #1a2b3c.");
const https = z.string().trim().max(500).refine((url) => url.startsWith("https://"), "Links must start with https://");

const layoutSchema = z.object({
  blocks: z.array(z.object({ type: z.enum(BLOCK_TYPES), visible: z.boolean() })).max(BLOCK_TYPES.length),
  colors: z.object({ accent: hex, background: hex, card: hex, text: hex }).nullable(),
  font: z.enum(FONTS),
  cardShape: z.enum(CARD_SHAPES),
  cardStyle: z.enum(CARD_STYLES),
  backdrop: z.object({
    kind: z.enum(BACKDROPS),
    pattern: z.enum(PATTERNS),
    photoPath: z.string().max(200).nullable(),
  }),
  links: z
    .array(z.object({ label: z.string().trim().min(1, "Give each link a label.").max(30), url: https }))
    .max(MAX_LINKS, `Up to ${MAX_LINKS} links.`),
  photos: z.array(z.string().max(200)).max(MAX_PHOTOS, `Up to ${MAX_PHOTOS} photos.`),
  pinnedPostId: z.string().max(64).nullable(),
  nowPlaying: z
    .object({
      kind: z.enum(["listening", "watching"]),
      text: z.string().trim().min(1).max(80),
      url: https.nullable(),
    })
    .nullable(),
});

/** Saved layouts: strict, then every block present and colors made readable. */
export function parseLayoutForSave(input: unknown): { ok: true; layout: ProfileLayout } | { ok: false; error: string } {
  const parsed = layoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Something in your layout looks off." };
  const layout = parsed.data as ProfileLayout;
  return {
    ok: true,
    layout: {
      ...layout,
      blocks: withAllBlocks(layout.blocks),
      colors: layout.colors ? fixContrast(layout.colors) : null,
    },
  };
}

/** Stored layouts: anything missing or invalid falls back to the default. */
export function readLayout(stored: unknown): ProfileLayout {
  const source = typeof stored === "object" && stored !== null ? (stored as Record<string, unknown>) : {};
  const layout = Object.fromEntries(
    Object.entries(layoutSchema.shape).map(([key, schema]) => {
      const field = (schema as z.ZodType).safeParse(source[key]);
      return [key, field.success ? field.data : DEFAULT_LAYOUT[key as keyof ProfileLayout]];
    }),
  ) as unknown as ProfileLayout;
  return { ...layout, blocks: withAllBlocks(layout.blocks) };
}
