/**
 * Device-side community shortcut preferences. Used when the person is signed
 * out, new, or in demo mode (signed-in accounts store `show_community_row` on
 * the profile instead). Membership changes in demo mode are overlaid on the
 * seed list so Join / Leave updates the row without a database.
 */

export const SHOW_ROW_STORAGE_KEY = "valid-show-community-row";
export const DEMO_AS_STORAGE_KEY = "valid-demo-as";
export const DEMO_MEMBERSHIPS_STORAGE_KEY = "valid-demo-memberships";
export const COMMUNITY_PREFS_EVENT = "valid-community-prefs";

export const ROW_BOOT_SCRIPT = `try{var d=document.documentElement,s=localStorage.getItem(${JSON.stringify(
  SHOW_ROW_STORAGE_KEY,
)});if(s==="false")d.dataset.communityRow="off";if(localStorage.getItem(${JSON.stringify(
  DEMO_AS_STORAGE_KEY,
)})==="signed-out")d.dataset.demoAs="signed-out"}catch(e){}`;

export interface DemoMemberships {
  /** Communities joined on top of the demo seed list. */
  joined: string[];
  /** Seed communities the demo person has left this session. */
  left: string[];
}

export function readShowRow(raw: string | null): boolean {
  if (raw === "false") return false;
  if (raw === "true") return true;
  return true;
}

export function readDemoAs(raw: string | null): "you" | "signed-out" {
  return raw === "signed-out" ? "signed-out" : "you";
}

export function readDemoMemberships(raw: string | null): DemoMemberships {
  try {
    const value = JSON.parse(raw ?? "{}") as Partial<DemoMemberships>;
    const joined = Array.isArray(value.joined) ? value.joined.filter((slug) => typeof slug === "string") : [];
    const left = Array.isArray(value.left) ? value.left.filter((slug) => typeof slug === "string") : [];
    return { joined, left };
  } catch {
    return { joined: [], left: [] };
  }
}

/** Apply demo join/leave overlays to the seed shortcut list (v/thestreets stays first). */
export function applyDemoMemberships<T extends { slug: string }>(
  seed: T[],
  streets: T | undefined,
  extras: T[],
  overlay: DemoMemberships,
): T[] {
  const bySlug = new Map(extras.map((community) => [community.slug, community]));
  const rest = seed.filter((community) => community.slug !== streets?.slug && !overlay.left.includes(community.slug));
  for (const slug of overlay.joined) {
    const community = bySlug.get(slug);
    if (community && community.slug !== streets?.slug && !rest.some((item) => item.slug === slug)) {
      rest.unshift(community);
    }
  }
  return streets ? [streets, ...rest] : rest;
}

export function toggleDemoMembership(overlay: DemoMemberships, slug: string, join: boolean): DemoMemberships {
  if (join) {
    return { joined: [...new Set([...overlay.joined, slug])], left: overlay.left.filter((item) => item !== slug) };
  }
  return { joined: overlay.joined.filter((item) => item !== slug), left: [...new Set([...overlay.left, slug])] };
}
