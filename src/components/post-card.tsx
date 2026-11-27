import Link from "next/link";

import { AuthorLabel } from "@/components/author-label";
import { CommentIcon } from "@/components/icons";
import { ReportButton } from "@/components/report-button";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VoteControl } from "@/components/vote-control";
import { compactNumber, timeAgo } from "@/lib/format";
import type { Post } from "@/lib/types";
import { capitalize, TERMS, termFor } from "@/lib/copy";

interface PostCardProps {
  post: Post;
  /** Full body on the post page; a short excerpt in feeds. */
  expanded?: boolean;
}

export function PostCard({ post, expanded = false }: PostCardProps) {
  const href = `/p/${post.id}`;

  return (
    <Card className="flex gap-2 p-post sm:gap-3">
      <VoteControl target="post" id={post.id} score={post.score} viewerVote={post.viewerVote} />
      <article className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-text-muted">
          <Link href={`/v/${post.community.slug}`} className="font-semibold text-text hover:text-accent">
            {TERMS.community.prefix}
            {post.community.slug}
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
            className={`text-sm text-text-muted ${expanded ? "whitespace-pre-line text-base text-text" : "line-clamp-3 compact:line-clamp-1"}`}
          >
            {post.body}
          </p>
        )}
        {post.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label={capitalize(TERMS.tag.many)}>
            {post.tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/t/${tag}`}
                  className="block rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent hover:bg-accent hover:text-on-accent"
                >
                  {TERMS.tag.prefix}
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="-ml-3 flex items-center gap-1 pt-1 compact:pt-0">
          <Link href={href} className={buttonStyles("ghost", "sm")}>
            <CommentIcon className="size-4" />
            {compactNumber(post.commentCount)} {termFor(post.commentCount, TERMS.comment)}
          </Link>
          <ReportButton target="post" id={post.id} />
        </div>
      </article>
    </Card>
  );
}
