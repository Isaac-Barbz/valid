import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import type { PersonSummary } from "@/lib/types";

/** Top 8 tiles: photo (or initial) plus name, each linking to that person's page. */
export function TopFriendsGrid({ friends, compact = false }: { friends: PersonSummary[]; compact?: boolean }) {
  return (
    <ol className={`grid grid-cols-4 ${compact ? "gap-2" : "gap-3 sm:gap-4"}`}>
      {friends.map((friend) => (
        <li key={friend.username}>
          <Link href={`/u/${friend.username}`} className="group flex flex-col items-center gap-1.5">
            <Avatar person={friend} size="fill" square />
            <span
              className={`w-full truncate text-center font-medium group-hover:text-accent ${compact ? "text-[0.6875rem]" : "text-xs sm:text-sm"}`}
            >
              {friend.displayName ?? friend.username}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
