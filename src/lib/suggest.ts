import { DEFAULT_COMMUNITY } from "@/lib/config";
import type { CommunityWithTags } from "@/lib/types";

/**
 * "Also drop it in v/…" suggestions while writing a drop. Plain keyword and
 * #tag matching against each community's slug, claimed tags, name, and
 * description: cheap, instant, and runs entirely in the browser.
 */

const STOP_WORDS = new Set(
  "the and for you your with this that have what just about from they them then than when where who how are was were but not all any can get got its it's our out own some too very will into like need help".split(
    " ",
  ),
);

function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

export interface Suggestion {
  community: CommunityWithTags;
  /** What matched, shown under the suggestion ("#braids", "hair"). */
  reasons: string[];
  score: number;
}

const WEIGHT = { tag: 3, keyword: 2, description: 1 } as const;
const MIN_SCORE = 2;

export function suggestCommunities(
  communities: CommunityWithTags[],
  draft: { title: string; body: string; tags: string[] },
  exclude: string,
  limit = 3,
): Suggestion[] {
  const draftWords = new Set(words(`${draft.title} ${draft.body}`));

  return communities
    .filter((community) => community.slug !== exclude && community.slug !== DEFAULT_COMMUNITY)
    .map((community) => {
      const keywords = new Set([community.slug, ...community.tags]);
      const described = new Set(words(`${community.name} ${community.description}`));
      const reasons = new Map<string, number>();

      for (const tag of draft.tags) if (keywords.has(tag)) reasons.set(`#${tag}`, WEIGHT.tag);
      for (const word of draftWords) {
        if (reasons.has(`#${word}`)) continue;
        if (keywords.has(word)) reasons.set(word, WEIGHT.keyword);
        else if (described.has(word)) reasons.set(word, WEIGHT.description);
      }
      const score = [...reasons.values()].reduce((sum, weight) => sum + weight, 0);
      return { community, reasons: [...reasons.keys()].slice(0, 3), score };
    })
    .filter((suggestion) => suggestion.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score || a.community.slug.localeCompare(b.community.slug))
    .slice(0, limit);
}
