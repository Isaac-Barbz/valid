import type { Metadata } from "next";
import { Suspense } from "react";

import { ComposeForm } from "@/components/compose-form";
import { Card } from "@/components/ui/card";
import { listCommunities } from "@/lib/data";
import { TERMS } from "@/lib/copy";

export const metadata: Metadata = { title: TERMS.post.create };

async function Compose({ searchParams }: Pick<PageProps<"/submit">, "searchParams">) {
  const [{ c }, communities] = await Promise.all([searchParams, listCommunities()]);
  const defaultCommunity = typeof c === "string" ? c : undefined;
  return <ComposeForm communities={communities} defaultCommunity={defaultCommunity} />;
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
