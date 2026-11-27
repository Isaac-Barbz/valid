import Link from "next/link";
import { Suspense } from "react";

import { AccountMenu, AccountMenuSkeleton } from "@/components/account-menu";
import { SettingsIcon } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { TERMS } from "@/lib/copy";

/** Top bar on phones; desktop uses the left rail instead. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface md:hidden">
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <Wordmark />
        <div className="flex items-center gap-2">
          <Link href="/settings" aria-label={TERMS.settings.title} className={buttonStyles("ghost", "sm")}>
            <SettingsIcon className="size-5" />
          </Link>
          <Suspense fallback={<AccountMenuSkeleton />}>
            <AccountMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
