import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Feed, FeedSkeleton } from "@/components/feed";
import { ProfileView } from "@/components/profile/profile-view";
import { spaceTitle } from "@/lib/copy";
import { getFriendship, getPinnedPost, getProfile, getTopFriends, getWall } from "@/lib/data";

type Props = PageProps<"/u/[username]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: spaceTitle(username) };
}

async function ProfileContent({ params }: Pick<Props, "params">) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const [topFriends, wall, friendship, pinned] = await Promise.all([
    getTopFriends(profile),
    getWall(profile),
    getFriendship(profile),
    getPinnedPost(profile),
  ]);

  return (
    <ProfileView
      profile={profile}
      bannerUrl={profile.bannerUrl}
      mediaUrls={profile.mediaUrls}
      topFriends={topFriends}
      wall={wall}
      friendship={friendship}
      pinned={pinned}
      drops={
        <Suspense fallback={<FeedSkeleton />}>
          <Feed sort="new" authorUsername={profile.username} />
        </Suspense>
      }
    />
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
