import { Suspense, type ReactNode } from "react";

import { CommunityNav, CommunityNavSkeleton } from "@/components/community-nav";

/** Two-column page frame: main content plus the community list. */
export function FeedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-6 lg:py-6">
      <aside className="lg:order-last">
        <div className="lg:sticky lg:top-20">
          <Suspense fallback={<CommunityNavSkeleton />}>
            <CommunityNav />
          </Suspense>
        </div>
      </aside>
      <main className="flex min-w-0 flex-col gap-4">{children}</main>
    </div>
  );
}
