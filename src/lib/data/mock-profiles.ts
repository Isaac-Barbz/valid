import { DEFAULT_THEME } from "@/lib/profile-theme";
import type { PersonSummary, Profile, ProfileComment } from "@/lib/types";

/**
 * Demo-mode people, friendships, and wall comments. Nothing here is saved.
 * `DEMO_VIEWER` stands in for "you" so the profile tools can be previewed.
 */

export const DEMO_VIEWER = "starlight_jas";

type SeedProfile = Omit<Profile, "id" | "createdAt" | "lastSeenAt" | "friendCount" | "postCount"> & {
  seenMinutesAgo: number | null;
};

const blank = {
  displayName: null,
  avatarUrl: null,
  pronouns: null,
  location: null,
  mood: null,
  status: null,
  aboutMe: null,
  wantToMeet: null,
  bannerUrl: null,
  theme: DEFAULT_THEME,
  song: null,
  seenMinutesAgo: null,
} satisfies Omit<SeedProfile, "username">;

const seedProfiles: SeedProfile[] = [
  {
    ...blank,
    username: DEMO_VIEWER,
    displayName: "Jasmine",
    pronouns: "she/her",
    location: "Los Angeles",
    mood: "✨ creative",
    status: "redesigning my whole page at 2am, don't judge",
    aboutMe:
      "Night owl, playlist curator, chronic re-decorator of this page. I collect vintage cameras and bad puns. If you're in c/music we've probably argued about bridges.",
    wantToMeet: "People who send songs instead of “hey”. Bakers. Anyone who still says “thanks for the add.”",
    theme: { accent: "rose", background: "blush", font: "display" },
    song: { title: "Midnight Static", artist: "Neon Lullaby", url: null },
    seenMinutesAgo: 1,
  },
  {
    ...blank,
    username: "basslinebrie",
    displayName: "Brie",
    pronouns: "she/they",
    mood: "🎧 locked in",
    status: "second listen hits different",
    aboutMe: "Bass player, vinyl hoarder, c/music regular.",
    theme: { accent: "teal", background: "mint", font: "mono" },
    song: { title: "Low End Theory", artist: "Sample Band", url: null },
    seenMinutesAgo: 3,
  },
  { ...blank, username: "devdiaries", displayName: "Dev", mood: "☕ caffeinated", theme: { accent: "blue", background: "sky", font: "sans" }, seenMinutesAgo: 240 },
  { ...blank, username: "fitcheck_fran", displayName: "Fran", mood: "💅 pressed", theme: { accent: "amber", background: "butter", font: "serif" }, seenMinutesAgo: 30 },
  { ...blank, username: "midnightmunch", displayName: "Munch", mood: "🧀 hungry", seenMinutesAgo: 2 },
  { ...blank, username: "boxscore_ben", displayName: "Ben", mood: "🏀 game day", theme: { accent: "red", background: "plain", font: "display" }, seenMinutesAgo: null },
  { ...blank, username: "valid_team", displayName: "Valid Team", mood: "👋 welcoming", seenMinutesAgo: null },
  { ...blank, username: "jade_wav", displayName: "Jade", seenMinutesAgo: 8 },
  { ...blank, username: "marcus_k", displayName: "Marcus", seenMinutesAgo: null },
  { ...blank, username: "lulu_bakes", displayName: "Lulu", seenMinutesAgo: 1 },
  { ...blank, username: "dre_beats", displayName: "Dre", seenMinutesAgo: null },
  { ...blank, username: "sasha_p", displayName: "Sasha", seenMinutesAgo: 600 },
  { ...blank, username: "theo_codes", displayName: "Theo", seenMinutesAgo: 4 },
  { ...blank, username: "nia_glow", displayName: "Nia", seenMinutesAgo: null },
];

/** Accepted friendships as [a, b] pairs. */
const friendPairs: [string, string][] = [
  ...["jade_wav", "basslinebrie", "lulu_bakes", "dre_beats", "sasha_p", "theo_codes", "nia_glow", "marcus_k", "midnightmunch", "fitcheck_fran"].map(
    (friend): [string, string] => [DEMO_VIEWER, friend],
  ),
  ["basslinebrie", "dre_beats"],
  ["basslinebrie", "jade_wav"],
  ["devdiaries", "theo_codes"],
  ["fitcheck_fran", "nia_glow"],
];

/** Pending request sent to the demo viewer, so the "accept" state can be previewed. */
export const demoIncomingRequests = ["devdiaries"];

const topFriendOrder: Record<string, string[]> = {
  [DEMO_VIEWER]: ["jade_wav", "basslinebrie", "lulu_bakes", "dre_beats", "sasha_p", "theo_codes", "nia_glow", "marcus_k"],
  basslinebrie: ["dre_beats", DEMO_VIEWER, "jade_wav"],
};

interface SeedWallComment {
  id: string;
  profile: string;
  author: string;
  body: string;
  minutesAgo: number;
}

const seedWall: SeedWallComment[] = [
  { id: "w1", profile: DEMO_VIEWER, author: "jade_wav", body: "your profile song is a CHOICE and i respect it 💖", minutesAgo: 120 },
  { id: "w2", profile: DEMO_VIEWER, author: "marcus_k", body: "thanks for the add!! see you in c/music", minutesAgo: 60 * 26 },
  { id: "w3", profile: DEMO_VIEWER, author: "lulu_bakes", body: "Top 8 placement secured. Finally. 🏆", minutesAgo: 60 * 72 },
  { id: "w4", profile: "basslinebrie", author: DEMO_VIEWER, body: "that bassline thread was elite", minutesAgo: 300 },
];

function friendsOf(username: string): string[] {
  return friendPairs.flatMap(([a, b]) => (a === username ? [b] : b === username ? [a] : []));
}

function summary(seed: SeedProfile): PersonSummary {
  return { username: seed.username, displayName: seed.displayName, avatarUrl: seed.avatarUrl };
}

function findSeed(username: string): SeedProfile | undefined {
  return seedProfiles.find((seed) => seed.username.toLowerCase() === username.toLowerCase());
}

export function mockProfile(username: string, now: number, postCount: number): Profile | null {
  const seed = findSeed(username);
  if (!seed) return null;
  const { seenMinutesAgo, ...rest } = seed;
  return {
    ...rest,
    id: `u-${seed.username}`,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 90).toISOString(),
    lastSeenAt: seenMinutesAgo === null ? null : new Date(now - seenMinutesAgo * 60_000).toISOString(),
    friendCount: friendsOf(seed.username).length,
    postCount,
  };
}

/** Top 8 in the owner's order, topped up with other friends. */
export function mockTopFriends(username: string): PersonSummary[] {
  const friends = friendsOf(username);
  const picked = (topFriendOrder[username] ?? []).filter((friend) => friends.includes(friend));
  const ordered = [...picked, ...friends.filter((friend) => !picked.includes(friend))].slice(0, 8);
  return ordered.flatMap((name) => {
    const seed = findSeed(name);
    return seed ? [summary(seed)] : [];
  });
}

export function mockAreFriends(a: string, b: string): boolean {
  return friendsOf(a).includes(b);
}

export function mockWall(username: string, now: number): ProfileComment[] {
  return seedWall
    .filter((comment) => comment.profile === username)
    .flatMap((comment) => {
      const author = findSeed(comment.author);
      if (!author) return [];
      return [
        {
          id: comment.id,
          author: summary(author),
          body: comment.body,
          createdAt: new Date(now - comment.minutesAgo * 60_000).toISOString(),
        },
      ];
    });
}
