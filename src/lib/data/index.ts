import "server-only";

import { connection } from "next/server";

import { isSupabaseConfigured } from "@/lib/config";
import { buildCommentTree, sortPosts } from "@/lib/ranking";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Comment, CommentNode, Community, Post, SortMode, Viewer, VoteValue } from "@/lib/types";

import { mockComments, mockCommunities, mockPosts } from "./mock";

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

export async function getFeed(options: { sort: SortMode; communitySlug?: string }): Promise<Post[]> {
  const { sort, communitySlug } = options;

  if (!isSupabaseConfigured) {
    const posts = mockPosts(await demoNow()).filter(
      (post) => !communitySlug || post.community.slug === communitySlug,
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
