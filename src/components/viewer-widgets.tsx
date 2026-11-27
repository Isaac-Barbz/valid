import Link from "next/link";

import { TopFriendsGrid } from "@/components/top-friends-grid";
import { Avatar } from "@/components/ui/avatar";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TERMS } from "@/lib/copy";
import { getTopFriends, getViewerProfile } from "@/lib/data";

/** Top of the home feed: your mood and status, or an invite to make a page. */
export async function MoodBar() {
  const profile = await getViewerProfile();

  if (!profile) {
    return (
      <Card className="flex items-center justify-between gap-3 p-4">
        <p className="text-sm">
          <span className="font-semibold">Make it yours.</span>{" "}
          <span className="text-text-muted">Sign in to set your mood, pick your colors, and build your Top 8.</span>
        </p>
        <Link href="/signin" className={buttonStyles("primary", "sm")}>
          Sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card className="flex items-center gap-3 p-3 sm:p-4">
      <Avatar person={profile} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-muted">Your {TERMS.profile.mood.toLowerCase()}</p>
        <p className="truncate text-sm font-semibold">
          {profile.mood ?? "Set a mood"}
          {profile.status && <span className="font-normal text-text-muted"> · {profile.status}</span>}
        </p>
      </div>
      <Link href={`/u/${profile.username}#customize`} className={buttonStyles("secondary", "sm")}>
        Edit
      </Link>
    </Card>
  );
}

/** Sidebar card with the viewer's Top 8. */
export async function TopFriendsWidget() {
  const profile = await getViewerProfile();
  if (!profile) return null;
  const friends = await getTopFriends(profile);
  if (friends.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-text-muted uppercase">Your {TERMS.profile.topFriends}</h2>
        <Link href={`/u/${profile.username}`} className="text-xs font-semibold text-accent hover:text-accent-hover">
          {TERMS.profile.own}
        </Link>
      </div>
      <TopFriendsGrid friends={friends} compact />
    </Card>
  );
}
