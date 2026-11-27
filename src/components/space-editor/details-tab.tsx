"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { fieldStyles } from "@/components/ui/field";
import { ImageUpload } from "@/components/space-editor/image-upload";
import type { SpaceDraft, UpdateDraft, UpdateLayout } from "@/components/space-editor/state";
import { TERMS } from "@/lib/copy";
import { MAX_LINKS, MAX_PHOTOS } from "@/lib/profile-layout";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-bold">{title}</h3>
      {children}
    </section>
  );
}

export function DetailsTab({
  draft,
  update,
  updateLayout,
  mediaUrls,
  onUploaded,
  pinnable,
}: {
  draft: SpaceDraft;
  update: UpdateDraft;
  updateLayout: UpdateLayout;
  mediaUrls: Record<string, string>;
  onUploaded: (path: string, url: string) => void;
  pinnable: { id: string; title: string }[];
}) {
  const { layout } = draft;
  const text = (key: "mood" | "status" | "aboutMe" | "wantToMeet") => ({
    value: draft[key],
    onChange: (event: { target: { value: string } }) => update((current) => ({ ...current, [key]: event.target.value })),
  });
  const song = (key: keyof SpaceDraft["song"]) => ({
    value: draft.song[key],
    onChange: (event: { target: { value: string } }) =>
      update((current) => ({ ...current, song: { ...current.song, [key]: event.target.value } })),
  });
  const now = layout.nowPlaying ?? { kind: "listening" as const, text: "", url: null };

  return (
    <div className="flex flex-col gap-4">
      <Section title={TERMS.profile.aboutMe}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={TERMS.profile.mood}>
            <input maxLength={40} className={fieldStyles} {...text("mood")} />
          </Field>
          <Field label={TERMS.profile.status}>
            <input maxLength={140} className={fieldStyles} {...text("status")} />
          </Field>
        </div>
        <Field label={TERMS.profile.aboutMe}>
          <textarea rows={4} maxLength={2000} className={fieldStyles} {...text("aboutMe")} />
        </Field>
        <Field label={TERMS.profile.wantToMeet}>
          <textarea rows={3} maxLength={1000} className={fieldStyles} {...text("wantToMeet")} />
        </Field>
      </Section>

      <Section title={TERMS.profile.song}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title">
            <input maxLength={80} className={fieldStyles} {...song("title")} />
          </Field>
          <Field label="Artist">
            <input maxLength={80} className={fieldStyles} {...song("artist")} />
          </Field>
        </div>
        <Field label="Audio link (https, optional)">
          <input type="url" maxLength={500} placeholder="https://" className={fieldStyles} {...song("url")} />
        </Field>
      </Section>

      <Section title="Now playing">
        <div className="flex gap-2">
          <select
            aria-label="Listening or watching"
            value={now.kind}
            onChange={(event) =>
              updateLayout({ nowPlaying: { ...now, kind: event.target.value === "watching" ? "watching" : "listening" } })
            }
            className={`${fieldStyles} w-36`}
          >
            <option value="listening">Listening</option>
            <option value="watching">Watching</option>
          </select>
          <input
            aria-label={now.kind === "listening" ? TERMS.profile.listening : TERMS.profile.watching}
            maxLength={80}
            placeholder="Album, show, or video"
            value={now.text}
            onChange={(event) => updateLayout({ nowPlaying: event.target.value ? { ...now, text: event.target.value } : null })}
            className={fieldStyles}
          />
        </div>
      </Section>

      <Section title={TERMS.profile.links}>
        {layout.links.map((link, index) => (
          <div key={index} className="flex gap-2">
            <input
              aria-label={`Link ${index + 1} label`}
              maxLength={30}
              placeholder="Label"
              value={link.label}
              onChange={(event) =>
                updateLayout({ links: layout.links.map((l, i) => (i === index ? { ...l, label: event.target.value } : l)) })
              }
              className={`${fieldStyles} w-32 shrink-0`}
            />
            <input
              aria-label={`Link ${index + 1} address`}
              type="url"
              maxLength={300}
              placeholder="https://"
              value={link.url}
              onChange={(event) =>
                updateLayout({ links: layout.links.map((l, i) => (i === index ? { ...l, url: event.target.value } : l)) })
              }
              className={fieldStyles}
            />
            <Button
              variant="ghost"
              aria-label={`Remove link ${index + 1}`}
              onClick={() => updateLayout({ links: layout.links.filter((_, i) => i !== index) })}
            >
              ×
            </Button>
          </div>
        ))}
        {layout.links.length < MAX_LINKS && (
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            onClick={() => updateLayout({ links: [...layout.links, { label: "", url: "https://" }] })}
          >
            Add link
          </Button>
        )}
      </Section>

      <Section title={TERMS.profile.photos}>
        {layout.photos.length > 0 && (
          <ul className="grid grid-cols-3 gap-2">
            {layout.photos.map((path) => (
              <li key={path} className="relative aspect-square overflow-hidden rounded-control bg-surface-muted">
                {mediaUrls[path] && <Image src={mediaUrls[path]} alt="" fill unoptimized className="object-cover" />}
                <button
                  type="button"
                  onClick={() => updateLayout({ photos: layout.photos.filter((p) => p !== path) })}
                  aria-label="Remove photo"
                  className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-surface text-text shadow"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <ImageUpload
          kind="photo"
          label={`Add photo (${layout.photos.length}/${MAX_PHOTOS})`}
          disabled={layout.photos.length >= MAX_PHOTOS}
          onUploaded={(path, url) => {
            onUploaded(path, url);
            updateLayout({ photos: [...layout.photos, path] });
          }}
        />
      </Section>

      <Section title={TERMS.profile.pinned}>
        <select
          aria-label={TERMS.profile.pinned}
          value={layout.pinnedPostId ?? ""}
          onChange={(event) => updateLayout({ pinnedPostId: event.target.value || null })}
          className={fieldStyles}
        >
          <option value="">None</option>
          {pinnable.map((post) => (
            <option key={post.id} value={post.id}>
              {post.title}
            </option>
          ))}
        </select>
      </Section>
    </div>
  );
}
