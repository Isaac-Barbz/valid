import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Feed, FeedSkeleton } from "@/components/feed";
import { FeedLayout } from "@/components/feed-layout";
import { SortTabs } from "@/components/sort-tabs";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCommunity } from "@/lib/data";
import { parseSort } from "@/lib/ranking";
import { TERMS } from "@/lib/copy";

type Props = PageProps<"/c/[slug]">;

async function CommunityContent({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const community = await getCommunity(slug);
  if (!community) notFound();
  const sort = parseSort(query.sort);

  return (
    <>
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-bold">{community.name}</h1>
          <p className="text-sm text-text-muted">
            {TERMS.community.prefix}
            {community.slug} · {community.description}
          </p>
        </div>
        <Link href={`/submit?c=${community.slug}`} className={buttonStyles("primary", "sm")}>
          {TERMS.post.create}
        </Link>
      </Card>
      <SortTabs basePath={`/c/${community.slug}`} active={sort} />
      <Feed sort={sort} communitySlug={community.slug} />
    </>
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
