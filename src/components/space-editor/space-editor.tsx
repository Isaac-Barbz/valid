"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveSpace } from "@/app/actions";
import { ProfileView } from "@/components/profile/profile-view";
import { BlocksTab } from "@/components/space-editor/blocks-tab";
import { ColorsTab } from "@/components/space-editor/colors-tab";
import { DetailsTab } from "@/components/space-editor/details-tab";
import type { SpaceDraft, UpdateDraft, UpdateLayout } from "@/components/space-editor/state";
import { StyleTab } from "@/components/space-editor/style-tab";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { capitalize, TERMS } from "@/lib/copy";
import type { ActionResult, PersonSummary, Post, Profile, ProfileComment } from "@/lib/types";

const TABS = ["blocks", "colors", "style", "details"] as const;
type Tab = (typeof TABS)[number];

interface SpaceEditorProps {
  profile: Profile;
  topFriends: PersonSummary[];
  wall: ProfileComment[];
  /** The owner's named drops, for the pinned drop picker and the preview. */
  drops: Post[];
}

/** "Customize your space": edit blocks, colors, style, and details with a live preview. */
export function SpaceEditor({ profile, topFriends, wall, drops }: SpaceEditorProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("blocks");
  const [draft, setDraft] = useState<SpaceDraft>(() => ({
    layout: profile.layout,
    bannerPath: profile.bannerPath,
    mood: profile.mood ?? "",
    status: profile.status ?? "",
    aboutMe: profile.aboutMe ?? "",
    wantToMeet: profile.wantToMeet ?? "",
    song: { title: profile.song?.title ?? "", artist: profile.song?.artist ?? "", url: profile.song?.url ?? "" },
  }));
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl);
  const [mediaUrls, setMediaUrls] = useState(profile.mediaUrls);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const update: UpdateDraft = (change) => {
    setResult(null);
    setDraft(change);
  };
  const updateLayout: UpdateLayout = (change) => update((current) => ({ ...current, layout: { ...current.layout, ...change } }));
  const addMedia = (path: string, url: string) => setMediaUrls((current) => ({ ...current, [path]: url }));

  function save() {
    startTransition(async () => {
      const outcome = await saveSpace({
        layout: draft.layout,
        bannerPath: draft.bannerPath,
        mood: draft.mood,
        status: draft.status,
        aboutMe: draft.aboutMe,
        wantToMeet: draft.wantToMeet,
        song: draft.song.title.trim() ? draft.song : null,
      });
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  }

  const previewProfile: Profile = {
    ...profile,
    mood: draft.mood || null,
    status: draft.status || null,
    aboutMe: draft.aboutMe || null,
    wantToMeet: draft.wantToMeet || null,
    song: draft.song.title ? { title: draft.song.title, artist: draft.song.artist, url: draft.song.url || null } : null,
  };
  const pinned = drops.find((post) => post.id === draft.layout.pinnedPostId) ?? null;

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)] gap-4 px-4 py-4 lg:grid-cols-[26rem_minmax(0,1fr)] lg:gap-6 lg:py-6">
      <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto">
        <h1 className="font-display text-2xl font-bold">{TERMS.profile.customize}</h1>
        <Card className="flex flex-col gap-4 p-4">
          <div role="tablist" aria-label="Customize" className="flex gap-1 rounded-control bg-surface-muted p-1">
            {TABS.map((id) => (
              <button
                key={id}
                role="tab"
                type="button"
                id={`tab-${id}`}
                aria-selected={tab === id}
                aria-controls="space-panel"
                onClick={() => setTab(id)}
                className="flex-1 rounded-control px-2 py-1.5 text-sm font-medium text-text-muted aria-selected:bg-surface aria-selected:text-text aria-selected:shadow-sm"
              >
                {capitalize(id)}
              </button>
            ))}
          </div>
          <div role="tabpanel" id="space-panel" aria-labelledby={`tab-${tab}`}>
            {tab === "blocks" && (
              <BlocksTab blocks={draft.layout.blocks} onChange={(blocks) => updateLayout({ blocks })} />
            )}
            {tab === "colors" && <ColorsTab colors={draft.layout.colors} onChange={(colors) => updateLayout({ colors })} />}
            {tab === "style" && (
              <StyleTab
                draft={draft}
                updateLayout={updateLayout}
                mediaUrls={mediaUrls}
                bannerUrl={bannerUrl}
                onUploaded={addMedia}
                onBanner={(path, url) => {
                  setBannerUrl(url);
                  update((current) => ({ ...current, bannerPath: path }));
                }}
              />
            )}
            {tab === "details" && (
              <DetailsTab
                draft={draft}
                update={update}
                updateLayout={updateLayout}
                mediaUrls={mediaUrls}
                onUploaded={addMedia}
                pinnable={drops.map((post) => ({ id: post.id, title: post.title }))}
              />
            )}
          </div>
        </Card>
        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-3 shadow-card md:bottom-4">
          <div className="min-w-0 text-sm">
            <FormMessage state={result} success="Saved." />
          </div>
          <Button onClick={save} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <section aria-label="Preview" className="flex min-w-0 flex-col gap-2">
        <h2 className="text-xs font-bold tracking-wide text-text-muted uppercase">Preview</h2>
        <div inert className="overflow-hidden rounded-card border border-border">
          <ProfileView
            preview
            profile={previewProfile}
            layout={draft.layout}
            bannerUrl={bannerUrl}
            mediaUrls={mediaUrls}
            topFriends={topFriends}
            wall={wall}
            friendship="self"
            pinned={pinned}
            drops={
              <p className="rounded-card border border-card-outline bg-surface p-4 text-sm text-text-muted shadow-card">
                Your {drops.length} {drops.length === 1 ? TERMS.post.one : TERMS.post.many} show here.
              </p>
            }
          />
        </div>
      </section>
    </div>
  );
}
