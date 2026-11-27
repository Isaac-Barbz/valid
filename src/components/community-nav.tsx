import { NavLink } from "@/components/nav-link";
import { Card } from "@/components/ui/card";
import { listCommunities } from "@/lib/data";
import { capitalize, TERMS } from "@/lib/copy";

/** Communities as a scrolling chip row on mobile and a sidebar list on desktop. */
export async function CommunityNav() {
  const communities = await listCommunities();

  return (
    <>
      <nav aria-label={capitalize(TERMS.community.many)} className="-mx-4 overflow-x-auto px-4 lg:hidden">
        <ul className="flex w-max gap-2 pb-1">
          {communities.map((community) => (
            <li key={community.id}>
              <NavLink
                href={`/v/${community.slug}`}
                className="block rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors"
                activeClassName="border-accent bg-accent-soft text-accent"
                inactiveClassName="border-border bg-surface text-text-muted hover:text-text"
              >
                {community.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Card className="hidden p-4 lg:block">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-text-muted uppercase">
          {capitalize(TERMS.community.many)}
        </h2>
        <nav aria-label={capitalize(TERMS.community.many)}>
          <ul className="flex flex-col gap-0.5">
            {communities.map((community) => (
              <li key={community.id}>
                <NavLink
                  href={`/v/${community.slug}`}
                  className="block rounded-control px-2 py-1.5 text-sm transition-colors"
                  activeClassName="bg-accent-soft font-medium text-accent"
                  inactiveClassName="text-text hover:bg-surface-muted"
                >
                  {TERMS.community.prefix}
                  {community.slug}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </Card>
    </>
  );
}

export function CommunityNavSkeleton() {
  return <div className="h-9 animate-pulse rounded-full bg-surface-muted lg:h-64 lg:rounded-card" />;
}
