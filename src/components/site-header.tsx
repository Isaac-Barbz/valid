import Link from "next/link";
import { Suspense } from "react";

import { signOut } from "@/app/actions";
import { CheckBadgeIcon, PlusIcon } from "@/components/icons";
import { Button, buttonStyles } from "@/components/ui/button";
import { getViewer } from "@/lib/data";

async function AccountMenu() {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <Link href="/signin" className={buttonStyles("secondary", "sm")}>
        Sign in
      </Link>
    );
  }
  return (
    <form action={signOut} className="flex items-center gap-2">
      <span className="hidden text-sm font-medium sm:inline">u/{viewer.username}</span>
      <Button type="submit" variant="ghost" size="sm">
        Sign out
      </Button>
    </form>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-1.5 text-lg font-bold tracking-tight">
          <CheckBadgeIcon className="size-6 text-accent" />
          Valid
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/submit" className={buttonStyles("primary", "sm")}>
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">Create</span>
            <span className="sr-only sm:hidden">Create post</span>
          </Link>
          <Suspense fallback={<div className="h-8 w-16 animate-pulse rounded-control bg-surface-muted" />}>
            <AccountMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
