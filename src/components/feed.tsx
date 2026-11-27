import Link from "next/link";

import { PostCard } from "@/components/post-card";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getFeed } from "@/lib/data";
import type { SortMode } from "@/lib/types";

export async function Feed({ sort, communitySlug }: { sort: SortMode; communitySlug?: string }) {
  const posts = await getFeed({ sort, communitySlug });

  if (posts.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="font-semibold">No posts yet</p>
        <p className="text-sm text-text-muted">Be the first to start the conversation.</p>
        <Link href={communitySlug ? `/submit?c=${communitySlug}` : "/submit"} className={buttonStyles()}>
          Create a post
        </Link>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
}

export function FeedSkeleton() {
  return (
    <ul className="flex flex-col gap-3" aria-busy aria-label="Loading posts">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <Card className="flex animate-pulse flex-col gap-3 p-4">
            <div className="h-3 w-1/3 rounded bg-surface-muted" />
            <div className="h-5 w-3/4 rounded bg-surface-muted" />
            <div className="h-3 w-full rounded bg-surface-muted" />
          </Card>
        </li>
      ))}
    </ul>
  );
}
