import Link from "next/link";

import { PostCard } from "@/components/post-card";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getFeed } from "@/lib/data";
import type { SortMode } from "@/lib/types";
import { TERMS } from "@/lib/copy";

interface FeedProps {
  sort: SortMode;
  communitySlug?: string;
  authorUsername?: string;
  tag?: string;
}

export async function Feed({ sort, communitySlug, authorUsername, tag }: FeedProps) {
  const posts = await getFeed({ sort, communitySlug, authorUsername, tag });

  if (posts.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="font-semibold">No {TERMS.post.many} yet</p>
        <p className="text-sm text-text-muted">Be the first to start the conversation.</p>
        <Link href={communitySlug ? `/submit?v=${communitySlug}` : "/submit"} className={buttonStyles()}>
          {TERMS.post.create}
        </Link>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-feed">
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
    <ul className="flex flex-col gap-3" aria-busy aria-label={`Loading ${TERMS.post.many}`}>
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
