import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SpaceEditor } from "@/components/space-editor/space-editor";
import { TERMS } from "@/lib/copy";
import { getFeed, getTopFriends, getViewerProfile, getWall } from "@/lib/data";

export const metadata: Metadata = { title: TERMS.profile.customize };

async function Editor() {
  const profile = await getViewerProfile();
  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 text-center text-sm text-text-muted">
        <Link href="/signin" className="font-semibold text-accent hover:text-accent-hover">
          Sign in
        </Link>{" "}
        to customize your space.
      </main>
    );
  }
  const [topFriends, wall, drops] = await Promise.all([
    getTopFriends(profile),
    getWall(profile),
    getFeed({ sort: "new", authorUsername: profile.username }),
  ]);
  return (
    <main className="flex flex-1 flex-col">
      <SpaceEditor profile={profile} topFriends={topFriends} wall={wall} drops={drops} />
    </main>
  );
}

export default function CustomizeSpacePage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 w-full max-w-7xl animate-pulse px-4 py-6" />}>
      <Editor />
    </Suspense>
  );
}
