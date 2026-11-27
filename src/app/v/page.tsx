import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { FeedLayout } from "@/components/feed-layout";
import { Card } from "@/components/ui/card";
import { DEFAULT_COMMUNITY } from "@/lib/config";
import { capitalize, TERMS } from "@/lib/copy";
import { listCommunitiesWithTags } from "@/lib/data";

export const metadata: Metadata = { title: capitalize(TERMS.community.many) };

async function CommunityList() {
  const communities = await listCommunitiesWithTags();
  // v/thestreets first: it's where any drop can land.
  const ordered = [...communities].sort(
    (a, b) => Number(b.slug === DEFAULT_COMMUNITY) - Number(a.slug === DEFAULT_COMMUNITY),
  );
  return (
    <ul className="grid gap-feed sm:grid-cols-2">
      {ordered.map((community) => (
        <li key={community.slug}>
          <Link href={`/v/${community.slug}`} className="group block h-full">
            <Card className="flex h-full flex-col gap-1.5 p-4 transition-colors group-hover:border-accent">
              <p className="text-xs font-bold text-accent">
                {TERMS.community.prefix}
                {community.slug}
              </p>
              <h2 className="font-display text-lg font-bold">{community.name}</h2>
              <p className="text-sm text-text-muted">{community.description}</p>
              {community.tags.length > 0 && (
                <p className="mt-auto pt-1 text-xs text-text-muted">
                  {community.tags
                    .slice(0, 4)
                    .map((tag) => `${TERMS.tag.prefix}${tag}`)
                    .join("  ")}
                </p>
              )}
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function CommunitiesPage() {
  return (
    <FeedLayout>
      <h1 className="font-display text-2xl font-bold">{capitalize(TERMS.community.many)}</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-surface-muted" />}>
        <CommunityList />
      </Suspense>
    </FeedLayout>
  );
}
