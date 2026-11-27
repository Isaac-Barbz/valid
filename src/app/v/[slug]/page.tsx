import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ClaimedTagsEditor } from "@/components/claimed-tags-editor";
import { Feed, FeedSkeleton } from "@/components/feed";
import { FeedLayout } from "@/components/feed-layout";
import { PostCard } from "@/components/post-card";
import { SortTabs } from "@/components/sort-tabs";
import { StreetStrips } from "@/components/street-strips";
import { SuggestionActions } from "@/components/suggestion-actions";
import { TagChip } from "@/components/tag-chip";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEFAULT_COMMUNITY } from "@/lib/config";
import { capitalize, TERMS } from "@/lib/copy";
import { getClaimedTags, getCommunity, getSuggestedPosts, viewerModerates } from "@/lib/data";
import { parseSort } from "@/lib/ranking";
import type { Community } from "@/lib/types";

type Props = PageProps<"/v/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${TERMS.community.prefix}${slug}` };
}

async function CommunityContent({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const community = await getCommunity(slug);
  if (!community) notFound();
  const sort = parseSort(query.sort);
  const isStreets = community.slug === DEFAULT_COMMUNITY;

  const [claimedTags, isModerator] = await Promise.all([getClaimedTags(community), viewerModerates(community)]);
  const showSuggested = isModerator && !isStreets && query.view === "suggested";
  const basePath = `/v/${community.slug}`;

  return (
    <>
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-bold">{community.name}</h1>
            <p className="text-sm text-text-muted">
              {TERMS.community.prefix}
              {community.slug} · {community.description}
            </p>
          </div>
          <Link href={`/submit?v=${community.slug}`} className={buttonStyles("primary", "sm")}>
            {TERMS.post.create}
          </Link>
        </div>
        {!isStreets && (claimedTags.length > 0 || isModerator) && (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <h2 className="text-xs font-bold tracking-wide text-text-muted uppercase">{TERMS.community.claimedTags}</h2>
            {isModerator ? (
              <ClaimedTagsEditor community={community.slug} tags={claimedTags} />
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {claimedTags.map((tag) => (
                  <li key={tag}>
                    <TagChip tag={tag} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      {isStreets && (
        <Suspense fallback={<div className="h-40 animate-pulse rounded-card bg-surface-muted" />}>
          <StreetStrips />
        </Suspense>
      )}

      {isModerator && !isStreets && (
        <nav aria-label="Moderator views" className="flex gap-4 border-b border-border px-1 text-sm font-semibold">
          <Link
            href={basePath}
            aria-current={showSuggested ? undefined : "page"}
            className="-mb-px border-b-2 border-transparent pb-2 text-text-muted aria-[current=page]:border-accent aria-[current=page]:text-text"
          >
            Feed
          </Link>
          <Link
            href={`${basePath}?view=suggested`}
            aria-current={showSuggested ? "page" : undefined}
            className="-mb-px border-b-2 border-transparent pb-2 text-text-muted aria-[current=page]:border-accent aria-[current=page]:text-text"
          >
            {TERMS.community.suggested}
          </Link>
        </nav>
      )}

      {showSuggested ? (
        <SuggestedQueue community={community} />
      ) : (
        <>
          <SortTabs basePath={basePath} active={sort} />
          <Feed sort={sort} communitySlug={community.slug} />
        </>
      )}
    </>
  );
}

async function SuggestedQueue({ community }: { community: Community }) {
  const posts = await getSuggestedPosts(community);
  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-text-muted">
        Nothing to review. {capitalize(TERMS.post.many)} in {TERMS.community.prefix}
        {DEFAULT_COMMUNITY} with your claimed {TERMS.tag.many} show up here.
      </Card>
    );
  }
  return (
    <ul className="flex flex-col gap-feed">
      {posts.map((post) => (
        <li key={post.id} className="flex flex-col gap-2">
          <PostCard post={post} />
          <div className="px-1">
            <SuggestionActions community={community.slug} postId={post.id} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function CommunityPage({ params, searchParams }: Props) {
  return (
    <FeedLayout>
      <Suspense fallback={<FeedSkeleton />}>
        <CommunityContent params={params} searchParams={searchParams} />
      </Suspense>
    </FeedLayout>
  );
}
