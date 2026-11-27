import { Suspense } from "react";

import { Feed, FeedSkeleton } from "@/components/feed";
import { FeedLayout } from "@/components/feed-layout";
import { SortTabs } from "@/components/sort-tabs";
import { MoodBar } from "@/components/viewer-widgets";
import { parseSort } from "@/lib/ranking";

async function HomeFeed({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const sort = parseSort((await searchParams).sort);
  return (
    <>
      <SortTabs basePath="/" active={sort} />
      <Feed sort={sort} />
    </>
  );
}

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <FeedLayout>
      <h1 className="sr-only">Home feed</h1>
      <Suspense fallback={<div className="h-16 animate-pulse rounded-card bg-surface-muted" />}>
        <MoodBar />
      </Suspense>
      <Suspense fallback={<FeedSkeleton />}>
        <HomeFeed searchParams={searchParams} />
      </Suspense>
    </FeedLayout>
  );
}
