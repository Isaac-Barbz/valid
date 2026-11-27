import Link from "next/link";

import { FlameIcon } from "@/components/icons";
import { TagChip } from "@/components/tag-chip";
import { Card } from "@/components/ui/card";
import { TERMS } from "@/lib/copy";
import { compactNumber } from "@/lib/format";
import { getPoppingCommunities, getTrendingTags } from "@/lib/data";

const stripHeading = "flex items-center gap-1.5 px-1 text-xs font-bold tracking-wide text-text-muted uppercase";

/** v/thestreets discovery strips: the best drop in each community right now, then trending #tags. */
export async function StreetStrips() {
  const [popping, trending] = await Promise.all([getPoppingCommunities(), getTrendingTags()]);

  return (
    <div className="flex flex-col gap-4">
      {popping.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="popping-heading">
          <h2 id="popping-heading" className={stripHeading}>
            <FlameIcon className="size-3.5 text-accent" />
            {TERMS.community.popping} {TERMS.community.prefix}…
          </h2>
          <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
            {popping.map(({ community, post }) => (
              <li key={community.slug} className="w-60 shrink-0 snap-start">
                <Card className="flex h-full flex-col gap-1 p-3">
                  <Link href={`/v/${community.slug}`} className="text-xs font-bold text-accent hover:underline">
                    {TERMS.community.prefix}
                    {community.slug}
                  </Link>
                  <Link href={`/p/${post.id}`} className="line-clamp-2 text-sm font-semibold hover:text-accent">
                    {post.title}
                  </Link>
                  <p className="mt-auto text-xs text-text-muted">
                    {compactNumber(post.score)} {TERMS.vote.score}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
      {trending.length > 0 && <TrendingTags tags={trending} />}
    </div>
  );
}

function TrendingTags({ tags }: { tags: { tag: string; dropCount: number }[] }) {
  return (
    <section className="flex flex-col gap-2" aria-labelledby="trending-heading">
      <h2 id="trending-heading" className={stripHeading}>
        {TERMS.tag.trending} {TERMS.tag.many}
      </h2>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {tags.map(({ tag, dropCount }) => (
          <li key={tag}>
            <TagChip tag={tag} count={dropCount} />
          </li>
        ))}
      </ul>
    </section>
  );
}
