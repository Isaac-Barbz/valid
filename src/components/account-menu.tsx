import Link from "next/link";

import { signOut } from "@/app/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonStyles } from "@/components/ui/button";
import { TERMS } from "@/lib/copy";
import { getViewer } from "@/lib/data";

/** Sign in, or the viewer's avatar plus Sign out. */
export async function AccountMenu() {
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

export function AccountMenuSkeleton() {
  return <div className="h-8 w-16 animate-pulse rounded-control bg-surface-muted" />;
}
