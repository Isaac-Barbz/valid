import type { ProfileLayout } from "@/lib/profile-layout";

export type SortMode = "hot" | "new" | "top";

export const SORT_MODES: readonly SortMode[] = ["hot", "new", "top"];

export type VoteValue = -1 | 0 | 1;

export type MemberRole = "member" | "moderator" | "owner";

export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
}

/** Public author info. `null` username means the content was posted anonymously. */
export interface Author {
  username: string | null;
}

export interface Post {
  id: string;
  community: Pick<Community, "slug" | "name">;
  author: Author;
  title: string;
  body: string;
  score: number;
  commentCount: number;
  createdAt: string;
  tags: string[];
  /** The signed-in viewer's vote on this post. */
  viewerVote: VoteValue;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  author: Author;
  body: string;
  isRemoved: boolean;
  score: number;
  createdAt: string;
  viewerVote: VoteValue;
}

export interface CommentNode extends Comment {
  replies: CommentNode[];
}

export interface Viewer {
  id: string;
  username: string;
}

/** Just enough of a person to show an avatar and a link to their page. */
export interface PersonSummary {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ProfileSong {
  title: string;
  artist: string;
  /** Direct https link to an audio file; `null` shows the song without a player. */
  url: string | null;
}

export interface Profile extends PersonSummary {
  id: string;
  pronouns: string | null;
  location: string | null;
  mood: string | null;
  status: string | null;
  aboutMe: string | null;
  wantToMeet: string | null;
  /** Storage path behind bannerUrl (kept when saving the editor). */
  bannerPath: string | null;
  bannerUrl: string | null;
  layout: ProfileLayout;
  /** Public URLs for the storage paths in `layout` (photos, backdrop). */
  mediaUrls: Record<string, string>;
  homeCommunitySlug: string | null;
  /** When false, the feed hides the community shortcut row. */
  showCommunityRow: boolean;
  song: ProfileSong | null;
  lastSeenAt: string | null;
  createdAt: string;
  friendCount: number;
  postCount: number;
}

export interface CommunityWithTags extends Community {
  tags: string[];
}

export interface TrendingTag {
  tag: string;
  dropCount: number;
}

/** A community's best recent drop, for the "Popping in v/…" strip. */
export interface PoppingCommunity {
  community: Pick<Community, "slug" | "name">;
  post: Pick<Post, "id" | "title" | "score" | "commentCount">;
}

/** How the signed-in viewer relates to a profile. */
export type Friendship = "self" | "none" | "outgoing" | "incoming" | "friends";

export interface ProfileComment {
  id: string;
  author: PersonSummary;
  body: string;
  createdAt: string;
}

export const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate" },
  { value: "violence", label: "Violence or threats" },
  { value: "sexual_content", label: "Sexual content" },
  { value: "illegal", label: "Illegal content" },
  { value: "other", label: "Something else" },
] as const;

export type ActionResult = { ok: true } | { ok: false; error: string; needsSignIn?: boolean };
