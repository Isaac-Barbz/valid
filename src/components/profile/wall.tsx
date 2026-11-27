import Link from "next/link";

import { WallForm } from "@/components/profile/wall-form";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { TERMS } from "@/lib/copy";
import { timeAgo } from "@/lib/format";
import type { Friendship, Profile, ProfileComment } from "@/lib/types";

interface WallProps {
  profile: Profile;
  comments: ProfileComment[];
  friendship: Friendship | null;
}

/** MySpace-style comment wall: the owner and their friends can write here. */
export function Wall({ profile, comments, friendship }: WallProps) {
  const name = profile.displayName ?? profile.username;

  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-5">
      <h2 className="text-lg font-bold">{TERMS.profile.wall}</h2>
      {friendship === "self" || friendship === "friends" ? (
        <WallForm username={profile.username} name={name} />
      ) : (
        <p className="rounded-control bg-surface-muted px-3 py-2 text-sm text-text-muted">
          {friendship === null ? (
            <>
              <Link href="/signin" className="font-semibold text-accent hover:text-accent-hover">
                Sign in
              </Link>{" "}
              to write on {name}&apos;s {TERMS.profile.wall.toLowerCase()}.
            </>
          ) : (
            <>Only {name}&apos;s {TERMS.friend.many} can write here.</>
          )}
        </p>
      )}
      {comments.length === 0 ? (
        <p className="text-sm text-text-muted">Nothing here yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <Link href={`/u/${comment.author.username}`} tabIndex={-1} aria-hidden className="shrink-0">
                <Avatar person={comment.author} size="md" />
              </Link>
              <div className="min-w-0">
                <p className="text-sm">
                  <Link href={`/u/${comment.author.username}`} className="font-semibold hover:text-accent">
                    {comment.author.displayName ?? comment.author.username}
                  </Link>{" "}
                  <time dateTime={comment.createdAt} className="text-xs text-text-muted">
                    {timeAgo(comment.createdAt)}
                  </time>
                </p>
                <p className="text-sm break-words whitespace-pre-line">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
