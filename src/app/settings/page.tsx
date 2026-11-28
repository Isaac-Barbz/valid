import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CommunityRowSetting } from "@/components/community-row-setting";
import { HomeCommunityForm } from "@/components/home-community-form";
import { PaletteIcon } from "@/components/icons";
import { LookSettings } from "@/components/look-settings";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TERMS } from "@/lib/copy";
import { isSupabaseConfigured } from "@/lib/config";
import { getViewer, getViewerProfile, listCommunities } from "@/lib/data";

export const metadata: Metadata = { title: TERMS.settings.title };

async function AccountSettings() {
  const [profile, communities] = await Promise.all([getViewerProfile(), listCommunities()]);
  if (!profile) {
    return (
      <p className="text-sm text-text-muted">
        <Link href="/signin" className="font-semibold text-accent hover:text-accent-hover">
          Sign in
        </Link>{" "}
        to pick a {TERMS.community.home.toLowerCase()} and customize your space.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <HomeCommunityForm communities={communities} current={profile.homeCommunitySlug} />
      <Link href="/settings/space" className={`${buttonStyles("secondary")} self-start`}>
        <PaletteIcon className="size-4" />
        {TERMS.profile.customize}
      </Link>
    </div>
  );
}


async function CommunityRowSettingSlot() {
  const viewer = await getViewer();
  const profile = viewer ? await getViewerProfile() : null;
  const accountValue = isSupabaseConfigured && viewer ? (profile?.showCommunityRow ?? true) : null;
  return <CommunityRowSetting accountValue={accountValue} />;
}

export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
      <h1 className="font-display text-2xl font-bold">{TERMS.settings.title}</h1>
      <Card className="flex flex-col gap-4 p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">{TERMS.settings.look}</h2>
          <p className="text-sm text-text-muted">Saved on this device. Other people&apos;s spaces keep their own colors.</p>
        </div>
        <LookSettings />
        <Suspense fallback={<div className="h-14 animate-pulse rounded-control bg-surface-muted" />}>
          <CommunityRowSettingSlot />
        </Suspense>
      </Card>
      <Card className="flex flex-col gap-4 p-4 sm:p-6">
        <h2 className="text-lg font-bold">{TERMS.profile.own}</h2>
        <Suspense fallback={<div className="h-24 animate-pulse rounded-control bg-surface-muted" />}>
          <AccountSettings />
        </Suspense>
      </Card>
    </main>
  );
}
