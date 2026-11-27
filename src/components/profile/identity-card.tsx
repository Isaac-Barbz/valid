import Link from "next/link";

import { MailIcon, PaletteIcon } from "@/components/icons";
import { FriendButton } from "@/components/profile/friend-button";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { capitalize, TERMS, termFor } from "@/lib/copy";
import { compactNumber, isOnline } from "@/lib/format";
import type { Friendship, Profile } from "@/lib/types";

/** Photo, name, presence, mood/status, friend actions, and counts. */
export function IdentityCard({ profile, friendship }: { profile: Profile; friendship: Friendship | null }) {
  const name = profile.displayName ?? profile.username;
  const details = [`${TERMS.user.prefix}${profile.username}`, profile.pronouns, profile.location].filter(Boolean);

  return (
    <Card className="flex flex-col items-center gap-3 p-5 text-center">
      <Avatar person={profile} size="xl" themed className="-mt-16 ring-4 ring-surface sm:-mt-20" />
      <div>
        <h1 className="text-3xl leading-tight font-bold text-balance">{name}</h1>
        <p className="text-sm text-text-muted">{details.join(" · ")}</p>
      </div>
      {isOnline(profile.lastSeenAt) && (
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-online">
          <span aria-hidden className="size-2 rounded-full bg-online" />
          {TERMS.profile.online}
        </p>
      )}
      {(profile.mood || profile.status) && (
        <div className="flex flex-col gap-1 text-sm">
          {profile.mood && (
            <p>
              <span className="font-semibold">{TERMS.profile.mood}:</span> {profile.mood}
            </p>
          )}
          {profile.status && <p className="text-text-muted italic">“{profile.status}”</p>}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        {friendship === "self" ? (
          <Link href="#customize" className={buttonStyles("secondary")}>
            <PaletteIcon className="size-4" />
            {TERMS.profile.customize}
          </Link>
        ) : (
          <>
            <FriendButton username={profile.username} friendship={friendship} />
            <Button variant="secondary" disabled title="Messages are coming soon">
              <MailIcon className="size-4" />
              {TERMS.profile.message}
            </Button>
          </>
        )}
      </div>
      <dl className="mt-1 grid w-full grid-cols-2 border-t border-border pt-3">
        <div className="flex flex-col">
          <dt className="text-xs text-text-muted">{capitalize(termFor(profile.friendCount, TERMS.friend))}</dt>
          <dd className="order-first font-bold">{compactNumber(profile.friendCount)}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs text-text-muted">{capitalize(termFor(profile.postCount, TERMS.post))}</dt>
          <dd className="order-first font-bold">{compactNumber(profile.postCount)}</dd>
        </div>
      </dl>
    </Card>
  );
}
