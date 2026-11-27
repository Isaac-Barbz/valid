import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Feed, FeedSkeleton } from "@/components/feed";
import { ProfileBanner } from "@/components/profile/banner";
import { CustomizePanel } from "@/components/profile/customize-panel";
import { IdentityCard } from "@/components/profile/identity-card";
import { SongCard } from "@/components/profile/song-card";
import { ProfileThemeScope } from "@/components/profile/theme-scope";
import { Wall } from "@/components/profile/wall";
import { TopFriendsGrid } from "@/components/top-friends-grid";
import { Card } from "@/components/ui/card";
import { capitalize, spaceTitle, TERMS, termFor } from "@/lib/copy";
import { getFriendship, getProfile, getTopFriends, getWall } from "@/lib/data";

type Props = PageProps<"/u/[username]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: spaceTitle(username) };
}

async function ProfileContent({ params }: Pick<Props, "params">) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const [topFriends, wall, friendship] = await Promise.all([
    getTopFriends(profile),
    getWall(profile),
    getFriendship(profile),
  ]);
  const name = profile.displayName ?? profile.username;
  const hasBlurbs = Boolean(profile.aboutMe || profile.wantToMeet);

  return (
    <ProfileThemeScope initial={{ theme: profile.theme, bannerUrl: profile.bannerUrl }}>
      <ProfileBanner />
      <main className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] gap-4 px-4 pb-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-6">
        <div className="relative flex flex-col gap-4">
          <div className="-mt-12 sm:-mt-16">
            <IdentityCard profile={profile} friendship={friendship} />
          </div>
          {profile.song && <SongCard song={profile.song} />}
          {friendship === "self" && <CustomizePanel profile={profile} />}
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:pt-6">
          {hasBlurbs && (
            <Card className="flex flex-col gap-4 p-4 sm:p-5">
              <h2 className="text-lg font-bold">{spaceTitle(name)}</h2>
              {profile.aboutMe && (
                <section>
                  <h3 className="mb-1 text-xs font-bold tracking-wide text-accent uppercase">{TERMS.profile.aboutMe}</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{profile.aboutMe}</p>
                </section>
              )}
              {profile.wantToMeet && (
                <section>
                  <h3 className="mb-1 text-xs font-bold tracking-wide text-accent uppercase">{TERMS.profile.wantToMeet}</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{profile.wantToMeet}</p>
                </section>
              )}
            </Card>
          )}

          <Card className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold">{TERMS.profile.friendSpace}</h2>
              <p className="text-xs text-text-muted">
                {name} has {profile.friendCount} {termFor(profile.friendCount, TERMS.friend)}
              </p>
            </div>
            {topFriends.length > 0 ? (
              <TopFriendsGrid friends={topFriends} />
            ) : (
              <p className="text-sm text-text-muted">No {TERMS.friend.many} yet.</p>
            )}
          </Card>

          <Wall profile={profile} comments={wall} friendship={friendship} />

          <section className="flex flex-col gap-3" aria-label={capitalize(TERMS.post.many)}>
            <h2 className="px-1 text-lg font-bold">
              {capitalize(TERMS.post.many)}
            </h2>
            <Feed sort="new" authorUsername={profile.username} />
          </section>
        </div>
      </main>
    </ProfileThemeScope>
  );
}

export default function ProfilePage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          <FeedSkeleton />
        </div>
      }
    >
      <ProfileContent params={params} />
    </Suspense>
  );
}
