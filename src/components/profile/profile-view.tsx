import Image from "next/image";
import type { ReactNode } from "react";

import { LinkIcon, MusicIcon, PinIcon, TvIcon } from "@/components/icons";
import { IdentityCard } from "@/components/profile/identity-card";
import { SongCard } from "@/components/profile/song-card";
import { SpaceScope } from "@/components/profile/space-scope";
import { Wall } from "@/components/profile/wall";
import { PostCard } from "@/components/post-card";
import { TopFriendsGrid } from "@/components/top-friends-grid";
import { Card } from "@/components/ui/card";
import { capitalize, spaceTitle, TERMS, termFor } from "@/lib/copy";
import type { BlockType, ProfileLayout } from "@/lib/profile-layout";
import type { Friendship, PersonSummary, Post, Profile, ProfileComment } from "@/lib/types";

export interface ProfileViewProps {
  profile: Profile;
  /** Overrides `profile.layout` (the editor's unsaved draft). */
  layout?: ProfileLayout;
  bannerUrl: string | null;
  /** Public URLs for storage paths in the layout (photos, backdrop). */
  mediaUrls: Record<string, string>;
  topFriends: PersonSummary[];
  wall: ProfileComment[];
  friendship: Friendship | null;
  pinned: Post | null;
  /** The drops list (a server-streamed feed on the real page, a stand-in in the editor). */
  drops: ReactNode;
  /** Rendered inside the editor: no page landmark. */
  preview?: boolean;
}

const blockHeading = "text-xs font-bold tracking-wide text-accent uppercase";

/** Someone's space: banner, identity card, then their blocks in the order they chose. */
export function ProfileView(props: ProfileViewProps) {
  const { profile, bannerUrl, mediaUrls, friendship, preview = false } = props;
  const Frame = preview ? "div" : "main";
  const layout = props.layout ?? profile.layout;
  const backdropUrl = layout.backdrop.photoPath ? (mediaUrls[layout.backdrop.photoPath] ?? null) : null;
  const blocks = layout.blocks
    .filter((block) => block.visible)
    .map((block) => ({ type: block.type, content: renderBlock(block.type, { ...props, layout }) }))
    .filter((block) => block.content !== null);

  return (
    <SpaceScope layout={layout} backdropUrl={backdropUrl} className="@container flex-1">
      <div className="relative h-36 w-full overflow-hidden bg-accent sm:h-52">
        {bannerUrl && <Image src={bannerUrl} alt="" fill unoptimized priority={!preview} className="object-cover" />}
      </div>
      <Frame className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] gap-4 px-4 pb-8 @4xl:grid-cols-[22rem_minmax(0,1fr)] @4xl:gap-6">
        <div className="relative">
          <div className="-mt-12 sm:-mt-16 @4xl:sticky @4xl:top-6">
            <IdentityCard profile={profile} friendship={friendship} />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-4 @4xl:pt-6">
          {blocks.map((block) => (
            <div key={block.type}>{block.content}</div>
          ))}
        </div>
      </Frame>
    </SpaceScope>
  );
}

function renderBlock(type: BlockType, props: ProfileViewProps & { layout: ProfileLayout }): ReactNode {
  const { profile, layout } = props;
  const name = profile.displayName ?? profile.username;

  switch (type) {
    case "about":
      if (!profile.aboutMe && !profile.wantToMeet) return null;
      return (
        <Card className="flex flex-col gap-4 p-4 sm:p-5">
          <h2 className="text-lg font-bold">{spaceTitle(name)}</h2>
          {profile.aboutMe && (
            <section>
              <h3 className={`mb-1 ${blockHeading}`}>{TERMS.profile.aboutMe}</h3>
              <p className="text-sm leading-relaxed whitespace-pre-line">{profile.aboutMe}</p>
            </section>
          )}
          {profile.wantToMeet && (
            <section>
              <h3 className={`mb-1 ${blockHeading}`}>{TERMS.profile.wantToMeet}</h3>
              <p className="text-sm leading-relaxed whitespace-pre-line">{profile.wantToMeet}</p>
            </section>
          )}
        </Card>
      );

    case "top8":
      return (
        <Card className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold">{TERMS.profile.friendSpace}</h2>
            <p className="text-xs text-text-muted">
              {name} has {profile.friendCount} {termFor(profile.friendCount, TERMS.friend)}
            </p>
          </div>
          {props.topFriends.length > 0 ? (
            <TopFriendsGrid friends={props.topFriends} />
          ) : (
            <p className="text-sm text-text-muted">No {TERMS.friend.many} yet.</p>
          )}
        </Card>
      );

    case "song":
      return profile.song ? <SongCard song={profile.song} /> : null;

    case "nowPlaying": {
      const now = layout.nowPlaying;
      if (!now?.text) return null;
      const Icon = now.kind === "listening" ? MusicIcon : TvIcon;
      const text = now.url ? (
        <a href={now.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="hover:text-accent">
          {now.text}
        </a>
      ) : (
        now.text
      );
      return (
        <Card className="flex items-center gap-3 p-4">
          <Icon className="size-5 shrink-0 text-accent" />
          <p className="min-w-0 text-sm">
            <span className="block text-xs font-bold tracking-wide text-accent uppercase">
              {now.kind === "listening" ? TERMS.profile.listening : TERMS.profile.watching}
            </span>
            <span className="font-semibold">{text}</span>
          </p>
        </Card>
      );
    }

    case "pinned":
      if (!props.pinned) return null;
      return (
        <section className="flex flex-col gap-2" aria-label={TERMS.profile.pinned}>
          <h2 className={`flex items-center gap-1.5 px-1 ${blockHeading}`}>
            <PinIcon className="size-3.5" />
            {TERMS.profile.pinned}
          </h2>
          <PostCard post={props.pinned} />
        </section>
      );

    case "photos": {
      const photos = layout.photos.flatMap((path) => (props.mediaUrls[path] ? [props.mediaUrls[path]] : []));
      if (photos.length === 0) return null;
      return (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <h2 className="text-lg font-bold">{TERMS.profile.photos}</h2>
          <ul className="grid grid-cols-3 gap-2">
            {photos.map((url) => (
              <li key={url} className="relative aspect-square overflow-hidden rounded-control bg-surface-muted">
                <Image src={url} alt="" fill unoptimized sizes="(min-width: 1024px) 14rem, 33vw" className="object-cover" />
              </li>
            ))}
          </ul>
        </Card>
      );
    }

    case "links":
      if (layout.links.length === 0) return null;
      return (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <h2 className="text-lg font-bold">{TERMS.profile.links}</h2>
          <ul className="flex flex-col gap-2">
            {layout.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="flex items-center gap-2 rounded-control border border-border px-3 py-2 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
                >
                  <LinkIcon className="size-4 shrink-0 text-accent" />
                  <span className="truncate">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </Card>
      );

    case "wall":
      return <Wall profile={profile} comments={props.wall} friendship={props.friendship} />;

    case "drops":
      return (
        <section className="flex flex-col gap-3" aria-label={capitalize(TERMS.post.many)}>
          <h2 className="px-1 text-lg font-bold">{capitalize(TERMS.post.many)}</h2>
          {props.drops}
        </section>
      );
  }
}
