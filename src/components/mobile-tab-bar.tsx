import Link from "next/link";
import { Suspense } from "react";

import { HomeIcon, PlusIcon, UserIcon } from "@/components/icons";
import { NavLink } from "@/components/nav-link";
import { TERMS } from "@/lib/copy";
import { getViewerProfile } from "@/lib/data";

const tab = "flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.6875rem] font-semibold transition-colors";
const activeTab = "text-accent";
const inactiveTab = "text-text-muted hover:text-text";

function HomeTabContent() {
  return (
    <>
      <HomeIcon className="size-6" />
      Home
    </>
  );
}

/** Static stand-in while the current path streams in. */
function HomeTab() {
  return (
    <Link href="/" className={`${tab} ${inactiveTab}`}>
      <HomeTabContent />
    </Link>
  );
}

async function SpaceTab() {
  const profile = await getViewerProfile();
  return (
    <NavLink
      href={profile ? `/u/${profile.username}` : "/signin"}
      className={tab}
      activeClassName={activeTab}
      inactiveClassName={inactiveTab}
    >
      <UserIcon className="size-6" />
      {TERMS.profile.own}
    </NavLink>
  );
}

/** Bottom navigation on phones, with the "new post" button in the middle. */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 flex items-center border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <Suspense fallback={<HomeTab />}>
        <NavLink href="/" className={tab} activeClassName={activeTab} inactiveClassName={inactiveTab}>
          <HomeTabContent />
        </NavLink>
      </Suspense>
      <div className="flex flex-1 justify-center">
        <Link
          href="/submit"
          aria-label={TERMS.post.create}
          className="flex size-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-card transition-colors hover:bg-accent-hover"
        >
          <PlusIcon className="size-6" />
        </Link>
      </div>
      <Suspense fallback={<span className={`${tab} ${inactiveTab}`} />}>
        <SpaceTab />
      </Suspense>
    </nav>
  );
}
