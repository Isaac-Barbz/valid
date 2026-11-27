import Link from "next/link";
import { Suspense } from "react";

import { signOut } from "@/app/actions";
import { PlusIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonStyles } from "@/components/ui/button";
import { TERMS } from "@/lib/copy";
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
    <form action={signOut} className="flex items-center gap-1">
      <Button type="submit" variant="ghost" size="sm">
        Sign out
      </Button>
      <Link href={`/u/${viewer.username}`} aria-label={TERMS.profile.own} className="rounded-full">
        <Avatar person={{ username: viewer.username, displayName: null, avatarUrl: null }} size="sm" />
      </Link>
    </form>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="font-display text-2xl font-extrabold tracking-tight">
          {TERMS.brand.toLowerCase()}
          <span className="text-accent">.</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/submit" className={`${buttonStyles("primary", "sm")} max-md:hidden`}>
            <PlusIcon className="size-4" />
            {TERMS.post.create}
          </Link>
          <Suspense fallback={<div className="h-8 w-16 animate-pulse rounded-control bg-surface-muted" />}>
            <AccountMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
