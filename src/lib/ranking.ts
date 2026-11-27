import type { Comment, CommentNode, Post, SortMode } from "./types";

/**
 * "Hot" rank: log-scaled score plus a time bonus, so a new post with a few
 * votes can outrank an old post with many. Mirrors public.hot_rank() in the
 * database migration; keep the two in sync.
 */
function hotRank(score: number, createdAt: string): number {
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const seconds = new Date(createdAt).getTime() / 1000;
  return Math.sign(score) * order + seconds / 45000;
}

/**
 * Discovery rank for v/thestreets: hot rank, but untagged drops act ~12h older
 * and low-engagement ones ~6h older. Mirrors public.street_rank().
 */
function streetRank(post: Post): number {
  const untagged = post.tags.length === 0 ? 1 : 0;
  const quiet = post.score + post.commentCount < 3 ? 0.5 : 0;
  return hotRank(post.score, post.createdAt) - untagged - quiet;
}

export function sortPosts(posts: Post[], sort: SortMode, options: { street?: boolean } = {}): Post[] {
  const sorted = [...posts];
  if (sort === "hot" && options.street) return sorted.sort((a, b) => streetRank(b) - streetRank(a));
  switch (sort) {
    case "new":
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "top":
      return sorted.sort((a, b) => b.score - a.score);
    case "hot":
      return sorted.sort(
        (a, b) => hotRank(b.score, b.createdAt) - hotRank(a.score, a.createdAt),
      );
  }
}

/** Turns a flat comment list into a reply tree, best-scored first at each level. */
export function buildCommentTree(comments: Comment[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  for (const comment of comments) nodes.set(comment.id, { ...comment, replies: [] });

  const roots: CommentNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }

  const byScore = (list: CommentNode[]) => {
    list.sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
    for (const node of list) byScore(node.replies);
  };
  byScore(roots);
  return roots;
}

export function parseSort(value: string | string[] | undefined): SortMode {
  return value === "new" || value === "top" ? value : "hot";
}
