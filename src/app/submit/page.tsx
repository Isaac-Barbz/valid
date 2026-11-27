import type { Metadata } from "next";
import { Suspense } from "react";

import { ComposeForm } from "@/components/compose-form";
import { Card } from "@/components/ui/card";
import { DEFAULT_COMMUNITY } from "@/lib/config";
import { getViewerProfile, listCommunitiesWithTags } from "@/lib/data";
import { TERMS } from "@/lib/copy";

export const metadata: Metadata = { title: TERMS.post.create };

async function Compose({ searchParams }: Pick<PageProps<"/submit">, "searchParams">) {
  const [{ v }, communities, viewer] = await Promise.all([searchParams, listCommunitiesWithTags(), getViewerProfile()]);
  // A community link (?v=slug) wins, then the person's home community, then v/thestreets.
  const requested = typeof v === "string" ? v : null;
  const defaultCommunity = [requested, viewer?.homeCommunitySlug, DEFAULT_COMMUNITY].find(
    (slug) => slug && communities.some((community) => community.slug === slug),
  );
  return <ComposeForm communities={communities} defaultCommunity={defaultCommunity ?? DEFAULT_COMMUNITY} />;
}

export default function SubmitPage({ searchParams }: PageProps<"/submit">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <Card className="flex flex-col gap-5 p-4 sm:p-6">
        <h1 className="font-display text-2xl font-bold">{TERMS.post.create}</h1>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-control bg-surface-muted" />}>
          <Compose searchParams={searchParams} />
        </Suspense>
      </Card>
    </main>
  );
}
