import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Feed, FeedSkeleton } from "@/components/feed";
import { FeedLayout } from "@/components/feed-layout";
import { SortTabs } from "@/components/sort-tabs";
import { Card } from "@/components/ui/card";
import { capitalize, TERMS } from "@/lib/copy";
import { getFeed, listCommunitiesWithTags } from "@/lib/data";
import { parseSort } from "@/lib/ranking";
import { normalizeTag } from "@/lib/tags";

type Props = PageProps<"/t/[tag]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return { title: `${TERMS.tag.prefix}${tag}` };
}

/** Communities that claim the tag first, then any others where it's been used. */
async function TalkingAbout({ tag }: { tag: string }) {
  const [communities, tagged] = await Promise.all([listCommunitiesWithTags(), getFeed({ sort: "top", tag })]);
  const usedIn = new Map<string, number>();
  for (const post of tagged) usedIn.set(post.community.slug, (usedIn.get(post.community.slug) ?? 0) + 1);

  const ranked = communities
    .map((community) => ({
      community,
      claims: community.tags.includes(tag),
      uses: usedIn.get(community.slug) ?? 0,
    }))
    .filter((entry) => entry.claims || entry.uses > 0)
    .sort((a, b) => Number(b.claims) - Number(a.claims) || b.uses - a.uses);
  if (ranked.length === 0) return null;

  return (
    <section className="flex flex-col gap-2" aria-labelledby="talking-heading">
      <h2 id="talking-heading" className="px-1 text-xs font-bold tracking-wide text-text-muted uppercase">
        {TERMS.tag.talkingAbout} {TERMS.tag.prefix}
        {tag}
      </h2>
      <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {ranked.map(({ community, claims, uses }) => (
          <li key={community.slug} className="shrink-0">
            <Link
              href={`/v/${community.slug}`}
              className="flex flex-col rounded-card border border-card-outline bg-surface px-3 py-2 shadow-card transition-colors hover:border-accent"
            >
              <span className="text-sm font-bold">
                {TERMS.community.prefix}
                {community.slug}
              </span>
              <span className="text-xs text-text-muted">
                {claims ? `Claims ${TERMS.tag.prefix}${tag}` : `${uses} ${uses === 1 ? TERMS.post.one : TERMS.post.many}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function TagContent({ params, searchParams }: Props) {
  const [{ tag: raw }, query] = await Promise.all([params, searchParams]);
  const tag = normalizeTag(decodeURIComponent(raw));
  if (!tag) notFound();
  const sort = parseSort(query.sort);

  return (
    <>
      <Card className="flex flex-col gap-1 p-4">
        <h1 className="font-display text-2xl font-bold">
          {TERMS.tag.prefix}
          {tag}
        </h1>
        <p className="text-sm text-text-muted">
          {capitalize(TERMS.post.many)} tagged {TERMS.tag.prefix}
          {tag} from every {TERMS.community.one}.
        </p>
      </Card>
      <Suspense fallback={<div className="h-16 animate-pulse rounded-card bg-surface-muted" />}>
        <TalkingAbout tag={tag} />
      </Suspense>
      <SortTabs basePath={`/t/${tag}`} active={sort} />
      <Feed sort={sort} tag={tag} />
    </>
  );
}

export default function TagPage({ params, searchParams }: Props) {
  return (
    <FeedLayout>
      <Suspense fallback={<FeedSkeleton />}>
        <TagContent params={params} searchParams={searchParams} />
      </Suspense>
    </FeedLayout>
  );
}
