import Link from "next/link";

import { AuthorLabel } from "@/components/author-label";
import { CommentIcon } from "@/components/icons";
import { ReportButton } from "@/components/report-button";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VoteControl } from "@/components/vote-control";
import { compactNumber, timeAgo } from "@/lib/format";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
  /** Full body on the post page; a short excerpt in feeds. */
  expanded?: boolean;
}

export function PostCard({ post, expanded = false }: PostCardProps) {
  const href = `/p/${post.id}`;

  return (
    <Card className="flex gap-2 p-3 sm:gap-3 sm:p-4">
      <VoteControl target="post" id={post.id} score={post.score} viewerVote={post.viewerVote} />
      <article className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-text-muted">
          <Link href={`/c/${post.community.slug}`} className="font-semibold text-text hover:text-accent">
            c/{post.community.slug}
          </Link>
          <span aria-hidden>·</span>
          <AuthorLabel author={post.author} />
          <span aria-hidden>·</span>
          <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
        </p>
        {expanded ? (
          <h1 className="text-xl font-semibold leading-snug text-balance">{post.title}</h1>
        ) : (
          <h2 className="text-base font-semibold leading-snug text-balance sm:text-lg">
            <Link href={href} className="hover:text-accent">
              {post.title}
            </Link>
          </h2>
        )}
        {post.body && (
          <p
            className={`text-sm text-text-muted ${expanded ? "whitespace-pre-line text-base text-text" : "line-clamp-3"}`}
          >
            {post.body}
          </p>
        )}
        <div className="-ml-3 flex items-center gap-1 pt-1">
          <Link href={href} className={buttonStyles("ghost", "sm")}>
            <CommentIcon className="size-4" />
            {compactNumber(post.commentCount)} {post.commentCount === 1 ? "comment" : "comments"}
          </Link>
          <ReportButton target="post" id={post.id} />
        </div>
      </article>
    </Card>
  );
}
