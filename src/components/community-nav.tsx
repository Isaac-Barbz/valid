"use client";

import { useSyncExternalStore } from "react";

import { NavLink } from "@/components/nav-link";
import { Card } from "@/components/ui/card";
import { DEFAULT_COMMUNITY } from "@/lib/config";
import {
  applyDemoMemberships,
  COMMUNITY_PREFS_EVENT,
  DEMO_AS_STORAGE_KEY,
  DEMO_MEMBERSHIPS_STORAGE_KEY,
  readDemoAs,
  readDemoMemberships,
  readShowRow,
  SHOW_ROW_STORAGE_KEY,
} from "@/lib/community-prefs";
import { capitalize, TERMS } from "@/lib/copy";
import type { Community } from "@/lib/types";

const chip =
  "block rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors";
const chipActive = "border-accent bg-accent-soft text-accent";
const chipInactive = "border-border bg-surface text-text-muted hover:text-text";
const findChip = "border-dashed border-border bg-surface text-text-muted hover:border-accent hover:text-accent";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COMMUNITY_PREFS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COMMUNITY_PREFS_EVENT, onChange);
  };
}

interface CommunityNavProps {
  /** v/thestreets first, then communities the viewer has joined (demo seed or account). */
  communities: Community[];
  /** Every community, so a demo Join can add one that wasn't in the seed list. */
  catalog: Community[];
  /**
   * Account preference when signed in with Supabase. `null` means the device
   * copy in localStorage is the source of truth (demo or signed out).
   */
  showRow: boolean | null;
}

function FindChip({ className, activeClassName, inactiveClassName }: { className: string; activeClassName: string; inactiveClassName: string }) {
  return (
    <NavLink href="/v" className={className} activeClassName={activeClassName} inactiveClassName={inactiveClassName}>
      {TERMS.community.find}
    </NavLink>
  );
}

/** Shortcut row (phones) and sidebar list (desktop): v/thestreets, joined communities, Find communities. */
export function CommunityNav({ communities, catalog, showRow }: CommunityNavProps) {
  const storedShow = useSyncExternalStore(subscribe, () => localStorage.getItem(SHOW_ROW_STORAGE_KEY), () => null);
  const storedAs = useSyncExternalStore(subscribe, () => localStorage.getItem(DEMO_AS_STORAGE_KEY), () => null);
  const storedMembers = useSyncExternalStore(subscribe, () => localStorage.getItem(DEMO_MEMBERSHIPS_STORAGE_KEY), () => null);

  const visible = storedShow !== null ? readShowRow(storedShow) : (showRow ?? true);
  if (!visible) return null;

  const streets = catalog.find((community) => community.slug === DEFAULT_COMMUNITY);
  const signedOutPreview = showRow === null && readDemoAs(storedAs) === "signed-out";
  const items = signedOutPreview
    ? streets
      ? [streets]
      : []
    : showRow === null
      ? applyDemoMemberships(communities, streets, catalog, readDemoMemberships(storedMembers))
      : communities;

  return (
    <div className="community-nav">
      <nav aria-label={capitalize(TERMS.community.many)} className="-mx-4 overflow-x-auto px-4 lg:hidden">
        <ul className="flex w-max gap-2 pb-1">
          {items.map((community) => (
            <li key={community.id} data-nav-community={community.slug}>
              <NavLink href={`/v/${community.slug}`} className={chip} activeClassName={chipActive} inactiveClassName={chipInactive}>
                {community.name}
              </NavLink>
            </li>
          ))}
          <li>
            <FindChip className={chip} activeClassName={chipActive} inactiveClassName={findChip} />
          </li>
        </ul>
      </nav>

      <Card className="hidden p-4 lg:block">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-text-muted uppercase">
          {TERMS.community.row}
        </h2>
        <nav aria-label={capitalize(TERMS.community.many)}>
          <ul className="flex flex-col gap-0.5">
            {items.map((community) => (
              <li key={community.id} data-nav-community={community.slug}>
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
            <li>
              <FindChip
                className="block rounded-control px-2 py-1.5 text-sm transition-colors"
                activeClassName="bg-accent-soft font-medium text-accent"
                inactiveClassName="text-text-muted hover:bg-surface-muted hover:text-text"
              />
            </li>
          </ul>
        </nav>
      </Card>
    </div>
  );
}

export function CommunityNavSkeleton() {
  return <div className="community-nav h-9 animate-pulse rounded-full bg-surface-muted lg:h-64 lg:rounded-card" />;
}

