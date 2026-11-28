import { Suspense, type ReactNode } from "react";

import { CommunityNavSlot, CommunityNavSkeleton } from "@/components/community-nav-slot";
import { TopFriendsWidget } from "@/components/viewer-widgets";

/** Two-column page frame: main content plus a sidebar (Top 8 and communities). */
export function FeedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-6 lg:py-6">
      <aside className="lg:order-last">
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <div className="max-lg:hidden">
            <Suspense fallback={<div className="h-56 animate-pulse rounded-card bg-surface-muted" />}>
              <TopFriendsWidget />
            </Suspense>
          </div>
          <Suspense fallback={<CommunityNavSkeleton />}>
            <CommunityNavSlot />
          </Suspense>
        </div>
      </aside>
      <main className="flex min-w-0 flex-col gap-4">{children}</main>
    </div>
  );
}
