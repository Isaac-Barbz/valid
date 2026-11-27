import "server-only";

import { connection } from "next/server";

import { isSupabaseConfigured } from "@/lib/config";
import { buildCommentTree, sortPosts } from "@/lib/ranking";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACCENTS, BACKGROUNDS, DEFAULT_THEME, FONTS, type ProfileTheme } from "@/lib/profile-theme";
import type {
  Comment,
  CommentNode,
  Community,
  Friendship,
  PersonSummary,
  Post,
  Profile,
  ProfileComment,
  SortMode,
  Viewer,
  VoteValue,
} from "@/lib/types";

import { mockComments, mockCommunities, mockPosts } from "./mock";
import { DEMO_VIEWER, demoIncomingRequests, mockAreFriends, mockProfile, mockTopFriends, mockWall } from "./mock-profiles";

/**
 * Read API for pages. Uses Supabase when configured, otherwise demo seed data.
 * Public reads go through the post_feed / comment_feed views, which never
 * expose the author of anonymous content.
 */

const FEED_LIMIT = 50;

/** Seed timestamps are relative to "now", so demo reads are request-time like real ones. */
async function demoNow(): Promise<number> {
  await connection();
  return Date.now();
}

interface PostFeedRow {
  id: string;
  community_slug: string;
  community_name: string;
  author_username: string | null;
  title: string;
  body: string;
  score: number;
  comment_count: number;
  created_at: string;
}

interface CommentFeedRow {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_username: string | null;
  body: string;
  is_removed: boolean;
  score: number;
  created_at: string;
}

interface VoteRow {
  id: string;
  value: VoteValue;
}

const POST_COLUMNS =
  "id, community_slug, community_name, author_username, title, body, score, comment_count, created_at";

function toPost(row: PostFeedRow, votes: Map<string, VoteValue>): Post {
  return {
    id: row.id,
    community: { slug: row.community_slug, name: row.community_name },
    author: { username: row.author_username },
    title: row.title,
    body: row.body,
    score: row.score,
    commentCount: row.comment_count,
    createdAt: row.created_at,
    viewerVote: votes.get(row.id) ?? 0,
  };
}

function toComment(row: CommentFeedRow, votes: Map<string, VoteValue>): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    author: { username: row.author_username },
    body: row.body,
    isRemoved: row.is_removed,
    score: row.score,
    createdAt: row.created_at,
    viewerVote: votes.get(row.id) ?? 0,
  };
}

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function viewerVotes(
  supabase: Supabase,
  table: "post_votes" | "comment_votes",
  ids: string[],
): Promise<Map<string, VoteValue>> {
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims || ids.length === 0) return new Map();

  const idColumn = table === "post_votes" ? "post_id" : "comment_id";
  const { data, error } = await supabase
    .from(table)
    .select(`id:${idColumn}, value`)
    .in(idColumn, ids);
  if (error) throw error;
  return new Map((data as VoteRow[]).map((vote) => [vote.id, vote.value]));
}

export async function listCommunities(): Promise<Community[]> {
  if (!isSupabaseConfigured) return mockCommunities;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("communities")
    .select("id, slug, name, description")
    .order("name");
  if (error) throw error;
  return data as Community[];
}

export async function getCommunity(slug: string): Promise<Community | null> {
  if (!isSupabaseConfigured) return mockCommunities.find((c) => c.slug === slug) ?? null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("communities")
    .select("id, slug, name, description")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as Community | null;
}

interface FeedOptions {
  sort: SortMode;
  communitySlug?: string;
  /** Only this person's named (not anonymous) posts. */
  authorUsername?: string;
}

export async function getFeed(options: FeedOptions): Promise<Post[]> {
  const { sort, communitySlug, authorUsername } = options;

  if (!isSupabaseConfigured) {
    const posts = mockPosts(await demoNow()).filter(
      (post) =>
        (!communitySlug || post.community.slug === communitySlug) &&
        (!authorUsername || post.author.username === authorUsername),
    );
    return sortPosts(posts, sort);
  }

  const supabase = await createSupabaseServerClient();
  const orderColumn = { hot: "hot_rank", new: "created_at", top: "score" }[sort];
  let query = supabase
    .from("post_feed")
    .select(POST_COLUMNS)
    .order(orderColumn, { ascending: false })
    .limit(FEED_LIMIT);
  if (communitySlug) query = query.eq("community_slug", communitySlug);
  if (authorUsername) query = query.eq("author_username", authorUsername);

  const { data, error } = await query;
  if (error) throw error;
  const rows = data as PostFeedRow[];
  const votes = await viewerVotes(supabase, "post_votes", rows.map((row) => row.id));
  return rows.map((row) => toPost(row, votes));
}

export async function getPost(id: string): Promise<Post | null> {
  if (!isSupabaseConfigured) return mockPosts(await demoNow()).find((post) => post.id === id) ?? null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("post_feed").select(POST_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as PostFeedRow;
  const votes = await viewerVotes(supabase, "post_votes", [row.id]);
  return toPost(row, votes);
}

export async function getCommentTree(postId: string): Promise<CommentNode[]> {
  if (!isSupabaseConfigured) return buildCommentTree(mockComments(postId, await demoNow()));

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("comment_feed")
    .select("id, post_id, parent_id, author_username, body, is_removed, score, created_at")
    .eq("post_id", postId)
    .order("created_at");
  if (error) throw error;
  const rows = data as CommentFeedRow[];
  const votes = await viewerVotes(supabase, "comment_votes", rows.map((row) => row.id));
  return buildCommentTree(rows.map((row) => toComment(row, votes)));
}

export async function getViewer(): Promise<Viewer | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return null;

  const { data, error } = await supabase.from("profiles").select("id, username").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as Viewer | null;
}

// ---------------------------------------------------------------------------
// Profiles, friends, and walls
// ---------------------------------------------------------------------------

interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  pronouns: string | null;
  location: string | null;
  mood: string | null;
  status: string | null;
  about_me: string | null;
  want_to_meet: string | null;
  banner_path: string | null;
  accent: string;
  background: string;
  font: string;
  song_title: string | null;
  song_artist: string | null;
  song_url: string | null;
  last_seen_at: string | null;
  created_at: string;
}

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, pronouns, location, mood, status, about_me, want_to_meet, " +
  "banner_path, accent, background, font, song_title, song_artist, song_url, last_seen_at, created_at";

interface PersonRow {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const PERSON_COLUMNS = "username, display_name, avatar_url";

function toPerson(row: PersonRow): PersonSummary {
  return { username: row.username, displayName: row.display_name, avatarUrl: row.avatar_url };
}

function pick<T extends string>(options: readonly T[], value: string, fallback: T): T {
  return options.find((option) => option === value) ?? fallback;
}

function toTheme(row: ProfileRow): ProfileTheme {
  return {
    accent: pick(ACCENTS, row.accent, DEFAULT_THEME.accent),
    background: pick(BACKGROUNDS, row.background, DEFAULT_THEME.background),
    font: pick(FONTS, row.font, DEFAULT_THEME.font),
  };
}

export async function getProfile(username: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) {
    const now = await demoNow();
    const postCount = mockPosts(now).filter((post) => post.author.username === username).length;
    return mockProfile(username, now, postCount);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("username", username).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as ProfileRow;

  const [friends, posts] = await Promise.all([
    supabase
      .from("friendships")
      .select("requester_id", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${row.id},addressee_id.eq.${row.id}`),
    supabase.from("post_feed").select("id", { count: "exact", head: true }).eq("author_id", row.id),
  ]);
  if (friends.error) throw friends.error;
  if (posts.error) throw posts.error;

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    pronouns: row.pronouns,
    location: row.location,
    mood: row.mood,
    status: row.status,
    aboutMe: row.about_me,
    wantToMeet: row.want_to_meet,
    bannerUrl: row.banner_path
      ? supabase.storage.from("profile-media").getPublicUrl(row.banner_path).data.publicUrl
      : null,
    theme: toTheme(row),
    song: row.song_title ? { title: row.song_title, artist: row.song_artist ?? "", url: row.song_url } : null,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    friendCount: friends.count ?? 0,
    postCount: posts.count ?? 0,
  };
}

const TOP_FRIENDS = 8;

/** The owner's Top 8 in their order, topped up with their newest friends. */
export async function getTopFriends(profile: Pick<Profile, "id" | "username">): Promise<PersonSummary[]> {
  if (!isSupabaseConfigured) return mockTopFriends(profile.username);

  const supabase = await createSupabaseServerClient();
  const [top, recent] = await Promise.all([
    supabase.from("top_friends").select("friend_id").eq("user_id", profile.id).order("position"),
    supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
      .order("accepted_at", { ascending: false })
      .limit(TOP_FRIENDS),
  ]);
  if (top.error) throw top.error;
  if (recent.error) throw recent.error;

  const ids = [
    ...top.data.map((row) => row.friend_id as string),
    ...recent.data.map((row) => (row.requester_id === profile.id ? row.addressee_id : row.requester_id) as string),
  ];
  const ordered = [...new Set(ids)].slice(0, TOP_FRIENDS);
  if (ordered.length === 0) return [];

  const { data, error } = await supabase.from("profiles").select(`id, ${PERSON_COLUMNS}`).in("id", ordered);
  if (error) throw error;
  const byId = new Map((data as (PersonRow & { id: string })[]).map((row) => [row.id, toPerson(row)]));
  return ordered.flatMap((id) => byId.get(id) ?? []);
}

const WALL_LIMIT = 20;

export async function getWall(profile: Pick<Profile, "id" | "username">): Promise<ProfileComment[]> {
  if (!isSupabaseConfigured) return mockWall(profile.username, await demoNow());

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profile_comments")
    .select(`id, body, created_at, author:profiles!profile_comments_author_id_fkey(${PERSON_COLUMNS})`)
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(WALL_LIMIT);
  if (error) throw error;
  return (data as unknown as { id: string; body: string; created_at: string; author: PersonRow }[]).map((row) => ({
    id: row.id,
    author: toPerson(row.author),
    body: row.body,
    createdAt: row.created_at,
  }));
}

/** How the viewer relates to a profile; `null` when signed out. */
export async function getFriendship(profile: Pick<Profile, "id" | "username">): Promise<Friendship | null> {
  if (!isSupabaseConfigured) {
    if (profile.username === DEMO_VIEWER) return "self";
    if (mockAreFriends(DEMO_VIEWER, profile.username)) return "friends";
    return demoIncomingRequests.includes(profile.username) ? "incoming" : "none";
  }

  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const viewerId = claims?.claims.sub;
  if (!viewerId) return null;
  if (viewerId === profile.id) return "self";

  const { data, error } = await supabase
    .from("friendships")
    .select("requester_id, status")
    .or(
      `and(requester_id.eq.${viewerId},addressee_id.eq.${profile.id}),` +
        `and(requester_id.eq.${profile.id},addressee_id.eq.${viewerId})`,
    )
    .maybeSingle();
  if (error) throw error;
  if (!data) return "none";
  if (data.status === "accepted") return "friends";
  return data.requester_id === viewerId ? "outgoing" : "incoming";
}

/** The signed-in person's profile; in demo mode, the demo profile stands in for "you". */
export async function getViewerProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) return getProfile(DEMO_VIEWER);
  const viewer = await getViewer();
  return viewer ? getProfile(viewer.username) : null;
}
