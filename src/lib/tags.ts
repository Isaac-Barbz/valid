/** Hashtags: lowercase letters, digits, and underscores, 2–32 characters (matches the SQL check). */
const TAG_PATTERN = /^[a-z0-9_]{2,32}$/;
const HASHTAG_IN_TEXT = /(?:^|[^\w#])#([A-Za-z0-9_]{2,32})\b/g;

const MAX_TAGS = 10;

export function normalizeTag(raw: string): string | null {
  const tag = raw.trim().replace(/^#/, "").toLowerCase();
  return TAG_PATTERN.test(tag) ? tag : null;
}

/** Tags from a "#braids, silkpress" style input plus any #hashtags in the text. */
export function extractTags(tagInput: string, ...texts: string[]): string[] {
  const fromInput = tagInput.split(/[\s,]+/).map(normalizeTag);
  const fromText = texts.flatMap((text) => [...text.matchAll(HASHTAG_IN_TEXT)].map((match) => normalizeTag(match[1])));
  return [...new Set([...fromInput, ...fromText].filter((tag): tag is string => tag !== null))].slice(0, MAX_TAGS);
}
