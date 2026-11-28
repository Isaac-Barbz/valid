import "server-only";

import { connection } from "next/server";

import { DEFAULT_COMMUNITY, isSupabaseConfigured } from "@/lib/config";
import { buildCommentTree, sortPosts } from "@/lib/ranking";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readLayout } from "@/lib/profile-layout-schema";
import type {
  Comment,
  CommentNode,
  Community,
  CommunityWithTags,
  Friendship,
  MemberRole,
  PersonSummary,
  PoppingCommunity,
  Post,
  Profile,
  ProfileComment,
  SortMode,
  TrendingTag,
  Viewer,
  VoteValue,
} from "@/lib/types";

import { mockClaimedTags, mockComments, mockCommunities, mockListings, mockMemberships, mockPosts } from "./mock";
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
  tags: string[];
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
  "id, community_slug, community_name, author_username, title, body, score, comment_count, created_at, tags";

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
    tags: row.tags,
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
  /** A community's own drops plus the ones accepted into it from elsewhere. */
  communitySlug?: string;
  /** Only this person's named (not lowkey) drops. */
  authorUsername?: string;
  tag?: string;
}

const LISTING_LIMIT = 200;

export async function getFeed(options: FeedOptions): Promise<Post[]> {
  const { sort, communitySlug, authorUsername, tag } = options;
  const street = communitySlug === DEFAULT_COMMUNITY;

  if (!isSupabaseConfigured) {
    const listed = new Set(
      mockListings
        .filter((listing) => listing.community === communitySlug && listing.status === "accepted")
        .map((listing) => listing.postId),
    );
    const posts = mockPosts(await demoNow()).filter(
      (post) =>
        (!communitySlug || post.community.slug === communitySlug || listed.has(post.id)) &&
        (!authorUsername || post.author.username === authorUsername) &&
        (!tag || post.tags.includes(tag)),
    );
    return sortPosts(posts, sort, { street });
  }

  const supabase = await createSupabaseServerClient();
  const orderColumn = { hot: street ? "street_rank" : "hot_rank", new: "created_at", top: "score" }[sort];
  let query = supabase
    .from("post_feed")
    .select(POST_COLUMNS)
    .order(orderColumn, { ascending: false })
    .limit(FEED_LIMIT);
  if (communitySlug) {
    const community = await getCommunity(communitySlug);
    if (!community) return [];
    const { data: listings, error } = await supabase
      .from("community_listings")
      .select("post_id")
      .eq("community_id", community.id)
      .eq("status", "accepted")
      .limit(LISTING_LIMIT);
    if (error) throw error;
    const ids = listings.map((listing) => listing.post_id as string);
    query = ids.length
      ? query.or(`community_slug.eq.${community.slug},id.in.(${ids.join(",")})`)
      : query.eq("community_slug", community.slug);
  }
  if (authorUsername) query = query.eq("author_username", authorUsername);
  if (tag) query = query.contains("tags", [tag]);

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
  layout: unknown;
  home_community: { slug: string } | null;
  show_community_row: boolean;
  song_title: string | null;
  song_artist: string | null;
  song_url: string | null;
  last_seen_at: string | null;
  created_at: string;
}

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, pronouns, location, mood, status, about_me, want_to_meet, " +
  "banner_path, layout, home_community:communities!profiles_home_community_id_fkey(slug), show_community_row, " +
  "song_title, song_artist, song_url, last_seen_at, created_at";

interface PersonRow {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const PERSON_COLUMNS = "username, display_name, avatar_url";

function toPerson(row: PersonRow): PersonSummary {
  return { username: row.username, displayName: row.display_name, avatarUrl: row.avatar_url };
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

  const layout = readLayout(row.layout);
  const publicUrl = (path: string) => supabase.storage.from("profile-media").getPublicUrl(path).data.publicUrl;
  const mediaPaths = [...layout.photos, ...(layout.backdrop.photoPath ? [layout.backdrop.photoPath] : [])];

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
    bannerPath: row.banner_path,
    bannerUrl: row.banner_path ? publicUrl(row.banner_path) : null,
    layout,
    mediaUrls: Object.fromEntries(mediaPaths.map((path) => [path, publicUrl(path)])),
    homeCommunitySlug: row.home_community?.slug ?? null,
    showCommunityRow: row.show_community_row,
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

// ---------------------------------------------------------------------------
// Tags, claimed tags, suggestions, and discovery
// ---------------------------------------------------------------------------

const TRENDING_LIMIT = 12;

export async function getTrendingTags(): Promise<TrendingTag[]> {
  if (!isSupabaseConfigured) {
    const counts = new Map<string, number>();
    for (const post of mockPosts(await demoNow())) {
      for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, TRENDING_LIMIT)
      .map(([tag, dropCount]) => ({ tag, dropCount }));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("trending_tags").select("tag, drop_count").limit(TRENDING_LIMIT);
  if (error) throw error;
  return (data as { tag: string; drop_count: number }[]).map((row) => ({ tag: row.tag, dropCount: row.drop_count }));
}

/** Every community with the tags it has claimed (for New drop suggestions and /t pages). */
export async function listCommunitiesWithTags(): Promise<CommunityWithTags[]> {
  if (!isSupabaseConfigured) {
    return mockCommunities.map((community) => ({ ...community, tags: mockClaimedTags[community.slug] ?? [] }));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("communities")
    .select("id, slug, name, description, community_tags(tag)")
    .order("name");
  if (error) throw error;
  return (data as (Community & { community_tags: { tag: string }[] })[]).map(({ community_tags, ...community }) => ({
    ...community,
    tags: community_tags.map((row) => row.tag),
  }));
}

export async function getClaimedTags(community: Community): Promise<string[]> {
  if (!isSupabaseConfigured) return mockClaimedTags[community.slug] ?? [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("community_tags").select("tag").eq("community_id", community.id).order("tag");
  if (error) throw error;
  return data.map((row) => row.tag as string);
}

/** Whether the viewer moderates this community (demo: the demo "you" moderates a few). */
export async function viewerModerates(community: Community): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const membership = mockMemberships.find((row) => row.slug === community.slug);
    return membership?.role === "moderator" || membership?.role === "owner";
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("is_moderator", { target_community: community.id });
  if (error) throw error;
  return data === true;
}

const SUGGESTION_LIMIT = 30;

/** v/thestreets drops with one of this community's claimed tags, not yet accepted or dismissed. */
export async function getSuggestedPosts(community: Community): Promise<Post[]> {
  const tags = await getClaimedTags(community);
  if (tags.length === 0 || community.slug === DEFAULT_COMMUNITY) return [];

  if (!isSupabaseConfigured) {
    const decided = new Set(mockListings.filter((l) => l.community === community.slug).map((l) => l.postId));
    return sortPosts(
      mockPosts(await demoNow()).filter(
        (post) =>
          post.community.slug === DEFAULT_COMMUNITY &&
          !decided.has(post.id) &&
          post.tags.some((tag) => tags.includes(tag)),
      ),
      "new",
    );
  }

  const supabase = await createSupabaseServerClient();
  const [{ data, error }, decided] = await Promise.all([
    supabase
      .from("post_feed")
      .select(POST_COLUMNS)
      .eq("community_slug", DEFAULT_COMMUNITY)
      .overlaps("tags", tags)
      .order("created_at", { ascending: false })
      .limit(SUGGESTION_LIMIT),
    supabase.from("community_listings").select("post_id").eq("community_id", community.id),
  ]);
  if (error) throw error;
  if (decided.error) throw decided.error;
  const skip = new Set(decided.data.map((row) => row.post_id as string));
  const rows = (data as PostFeedRow[]).filter((row) => !skip.has(row.id));
  const votes = await viewerVotes(supabase, "post_votes", rows.map((row) => row.id));
  return rows.map((row) => toPost(row, votes));
}

const POPPING_LIMIT = 6;

/** Each community's best drop right now, for the "Popping in v/…" strip on v/thestreets. */
export async function getPoppingCommunities(): Promise<PoppingCommunity[]> {
  const posts = await getFeed({ sort: "hot" });
  const best = new Map<string, Post>();
  for (const post of posts) {
    if (post.community.slug !== DEFAULT_COMMUNITY && !best.has(post.community.slug)) best.set(post.community.slug, post);
  }
  return [...best.values()].slice(0, POPPING_LIMIT).map((post) => ({
    community: post.community,
    post: { id: post.id, title: post.title, score: post.score, commentCount: post.commentCount },
  }));
}

/** A drop pinned to someone's space, only if it's theirs and named (not lowkey). */
export async function getPinnedPost(profile: Pick<Profile, "username" | "layout">): Promise<Post | null> {
  if (!profile.layout.pinnedPostId) return null;
  const post = await getPost(profile.layout.pinnedPostId);
  return post && post.author.username === profile.username ? post : null;
}

export async function getViewerMembership(community: Community): Promise<MemberRole | null> {
  if (!isSupabaseConfigured) {
    return mockMemberships.find((row) => row.slug === community.slug)?.role ?? null;
  }

  const viewer = await getViewer();
  if (!viewer) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", community.id)
    .eq("user_id", viewer.id)
    .maybeSingle();
  if (error) throw error;
  return (data?.role as MemberRole | undefined) ?? null;
}

function withStreetsFirst(streets: Community | undefined, joined: Community[]): Community[] {
  const rest = joined.filter((community) => community.slug !== DEFAULT_COMMUNITY);
  return streets ? [streets, ...rest] : rest;
}

/**
 * Communities for the feed shortcut row: v/thestreets first, then ones the
 * viewer has joined. Signed-out and new accounts only get v/thestreets;
 * demo mode uses the demo person's memberships.
 */
export async function listNavCommunities(): Promise<Community[]> {
  const streets = (await getCommunity(DEFAULT_COMMUNITY)) ?? undefined;

  if (!isSupabaseConfigured) {
    const joined = mockMemberships.flatMap((row) => {
      const community = mockCommunities.find((item) => item.slug === row.slug);
      return community ? [community] : [];
    });
    return withStreetsFirst(streets, joined);
  }

  const viewer = await getViewer();
  if (!viewer) return withStreetsFirst(streets, []);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("community_members")
    .select("joined_at, community_id, communities(id, slug, name, description)")
    .eq("user_id", viewer.id)
    .order("joined_at", { ascending: false });
  if (error) throw error;
  const joined = (data ?? []).flatMap((row) => {
    const value = (row as { communities?: Community | Community[] | null }).communities;
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  });
  return withStreetsFirst(streets, joined);
}
