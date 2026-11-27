import type { Comment, Community, Post } from "@/lib/types";

/** Seed content for demo mode (no Supabase configured). Nothing here is saved. */

export const mockCommunities: Community[] = [
  { id: "c-general", slug: "general", name: "General", description: "Anything and everything." },
  { id: "c-tech", slug: "tech", name: "Tech", description: "Gadgets, apps, code, and the future." },
  { id: "c-music", slug: "music", name: "Music", description: "New drops, old favorites, and hot takes." },
  { id: "c-gaming", slug: "gaming", name: "Gaming", description: "Every platform, every genre." },
  { id: "c-style", slug: "style", name: "Style", description: "Fashion, hair, beauty, and fits." },
  { id: "c-sports", slug: "sports", name: "Sports", description: "Scores, trades, and highlights." },
  { id: "c-food", slug: "food", name: "Food", description: "Recipes, restaurants, and late-night snacks." },
  { id: "c-askvalid", slug: "askvalid", name: "Ask Valid", description: "Ask anything. Get real answers." },
];

interface SeedPost {
  id: string;
  community: string;
  author: string | null;
  title: string;
  body: string;
  score: number;
  minutesAgo: number;
}

const seedPosts: SeedPost[] = [
  { id: "p1", community: "askvalid", author: null, title: "What's a take you have that would get you ratio'd everywhere else?", body: "This is the place. Go lowkey if you need to. I'll start: pineapple on pizza is elite and I'm tired of pretending it isn't.", score: 842, minutesAgo: 95 },
  { id: "p2", community: "tech", author: "devdiaries", title: "I replaced every app on my home screen with one I built myself. Here's what I learned", body: "Six months, eleven apps, a lot of late nights. The short version: the hardest part wasn't the code, it was deciding what to leave out.", score: 1290, minutesAgo: 60 * 7 },
  { id: "p3", community: "music", author: "basslinebrie", title: "Albums that hit different on the second listen?", body: "Some records just don't land the first time. Which ones grew on you?", score: 311, minutesAgo: 40 },
  { id: "p4", community: "style", author: "fitcheck_fran", title: "Silk press lasted 3 weeks in humidity. My full routine inside", body: "Heat protectant, low heat, wrap every night, and a satin pillowcase. Details in the comments.", score: 523, minutesAgo: 60 * 3 },
  { id: "p5", community: "gaming", author: null, title: "Unpopular opinion: games were better when they shipped finished", body: "Day-one patches the size of the game itself shouldn't be normal.", score: 2104, minutesAgo: 60 * 26 },
  { id: "p6", community: "food", author: "midnightmunch", title: "Rate my 2am grilled cheese setup", body: "Sourdough, sharp cheddar, a little mayo on the outside. Low and slow.", score: 97, minutesAgo: 18 },
  { id: "p7", community: "sports", author: "boxscore_ben", title: "Game thread: who's watching tonight?", body: "Drop your predictions before tip-off.", score: 64, minutesAgo: 9 },
  { id: "p8", community: "general", author: "valid_team", title: "Welcome to Valid 👋", body: "A place to talk about anything, as yourself or lowkey. Be kind, report what breaks the rules, and keep it valid.", score: 3050, minutesAgo: 60 * 48 },
  { id: "p10", community: "style", author: "starlight_jas", title: "Rate my page layout 1–10, be honest", body: "Spent all night on the colors. Rose on blush, bold font, Top 8 finally sorted.", score: 188, minutesAgo: 60 * 20 },
  { id: "p9", community: "tech", author: null, title: "Is it just me or did every app get worse this year?", body: "More ads, more subscriptions, fewer features.", score: -12, minutesAgo: 60 * 5 },
];

interface SeedComment {
  id: string;
  postId: string;
  parentId: string | null;
  author: string | null;
  body: string;
  score: number;
  minutesAgo: number;
}

const seedComments: SeedComment[] = [
  { id: "m1", postId: "p1", parentId: null, author: "basslinebrie", body: "Cereal is a soup. I will not be taking questions.", score: 210, minutesAgo: 80 },
  { id: "m2", postId: "p1", parentId: "m1", author: null, body: "Taking one question: why are you like this", score: 154, minutesAgo: 72 },
  { id: "m3", postId: "p1", parentId: "m2", author: "basslinebrie", body: "Built different.", score: 98, minutesAgo: 70 },
  { id: "m4", postId: "p1", parentId: null, author: null, body: "Sequels are usually better than the originals.", score: 47, minutesAgo: 50 },
  { id: "m5", postId: "p2", parentId: null, author: "midnightmunch", body: "Which one did you end up using the most?", score: 33, minutesAgo: 300 },
  { id: "m6", postId: "p2", parentId: "m5", author: "devdiaries", body: "Honestly the notes app. Simplest one, used every day.", score: 41, minutesAgo: 290 },
  { id: "m7", postId: "p4", parentId: null, author: null, body: "Saving this. What heat protectant do you use?", score: 22, minutesAgo: 120 },
  { id: "m8", postId: "p8", parentId: null, author: "fitcheck_fran", body: "First! Love the anonymous option.", score: 120, minutesAgo: 60 * 47 },
];

const minutesAgo = (minutes: number, now: number) =>
  new Date(now - minutes * 60_000).toISOString();

export function mockPosts(now: number): Post[] {
  return seedPosts.map((seed) => {
    const community = mockCommunities.find((c) => c.slug === seed.community);
    if (!community) throw new Error(`Unknown seed community: ${seed.community}`);
    return {
      id: seed.id,
      community: { slug: community.slug, name: community.name },
      author: { username: seed.author },
      title: seed.title,
      body: seed.body,
      score: seed.score,
      commentCount: seedComments.filter((c) => c.postId === seed.id).length,
      createdAt: minutesAgo(seed.minutesAgo, now),
      viewerVote: 0,
    };
  });
}

export function mockComments(postId: string, now: number): Comment[] {
  return seedComments
    .filter((seed) => seed.postId === postId)
    .map((seed) => ({
      id: seed.id,
      postId: seed.postId,
      parentId: seed.parentId,
      author: { username: seed.author },
      body: seed.body,
      isRemoved: false,
      score: seed.score,
      createdAt: minutesAgo(seed.minutesAgo, now),
      viewerVote: 0,
    }));
}
