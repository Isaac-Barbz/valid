import Link from "next/link";
import { Suspense, type ComponentType, type SVGProps } from "react";

import { AccountMenu, AccountMenuSkeleton } from "@/components/account-menu";
import { CommunitiesIcon, HomeIcon, PlusIcon, SettingsIcon, StreetIcon, UserIcon } from "@/components/icons";
import { NavLink } from "@/components/nav-link";
import { buttonStyles } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { DEFAULT_COMMUNITY } from "@/lib/config";
import { capitalize, TERMS } from "@/lib/copy";
import { getViewerProfile } from "@/lib/data";

interface RailItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const item = "flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-semibold transition-colors";
const active = "bg-accent-soft text-accent";
const inactive = "text-text-muted hover:bg-surface-muted hover:text-text";

function RailLink({ href, label, icon: Icon }: RailItem) {
  return (
    <NavLink href={href} className={item} activeClassName={active} inactiveClassName={inactive}>
      <Icon className="size-5" />
      {label}
    </NavLink>
  );
}

/** Same links without the active state, shown while the current path streams in. */
function StaticRailLink({ href, label, icon: Icon }: RailItem) {
  return (
    <Link href={href} className={`${item} ${inactive}`}>
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

async function SpaceLink() {
  const profile = await getViewerProfile();
  return <RailLink href={profile ? `/u/${profile.username}` : "/signin"} label={TERMS.profile.own} icon={UserIcon} />;
}

const MAIN_ITEMS: RailItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: `/v/${DEFAULT_COMMUNITY}`, label: "Streets", icon: StreetIcon },
  { href: "/v", label: capitalize(TERMS.community.many), icon: CommunitiesIcon },
];

/** Fixed left navigation on desktop; phones use the bottom tab bar. */
export function SideRail() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-rail flex-col gap-6 border-r border-border bg-surface px-3 py-5 md:flex">
      <div className="px-3">
        <Wordmark />
      </div>
      <nav aria-label="Main" className="flex flex-col gap-1">
        {MAIN_ITEMS.map((link) => (
          <Suspense key={link.href} fallback={<StaticRailLink {...link} />}>
            <RailLink {...link} />
          </Suspense>
        ))}
        <Suspense fallback={<StaticRailLink href="/signin" label={TERMS.profile.own} icon={UserIcon} />}>
          <SpaceLink />
        </Suspense>
      </nav>
      <Link href="/submit" className={buttonStyles("primary")}>
        <PlusIcon className="size-4" />
        {TERMS.post.create}
      </Link>
      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
        <Suspense fallback={<StaticRailLink href="/settings" label={TERMS.settings.title} icon={SettingsIcon} />}>
          <RailLink href="/settings" label={TERMS.settings.title} icon={SettingsIcon} />
        </Suspense>
        <div className="px-1">
          <Suspense fallback={<AccountMenuSkeleton />}>
            <AccountMenu />
          </Suspense>
        </div>
      </div>
    </aside>
  );
}
