"use client";

import { useActionState, useState, type ChangeEvent, type ReactNode } from "react";

import { updateProfile } from "@/app/actions";
import { PaletteIcon } from "@/components/icons";
import { useProfileLook } from "@/components/profile/theme-scope";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fieldStyles } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { TERMS } from "@/lib/copy";
import {
  ACCENTS,
  accentColor,
  BACKGROUNDS,
  backgroundColor,
  fontFamily,
  FONT_LABELS,
  FONTS,
} from "@/lib/profile-theme";
import { resizeToWebp } from "@/lib/resize-image";
import type { Profile } from "@/lib/types";

const swatch =
  "block size-8 rounded-full ring-1 ring-border transition-shadow peer-checked:ring-2 peer-checked:ring-text " +
  "peer-checked:ring-offset-2 peer-checked:ring-offset-surface peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-accent";

const sectionTitle = "text-xs font-semibold tracking-wide text-text-muted uppercase";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={`${sectionTitle} mb-2`}>{title}</legend>
      {children}
    </fieldset>
  );
}

/** Owner-only editor: solid colors, font, banner, song, mood, and blurbs, previewed live. */
export function CustomizePanel({ profile }: { profile: Profile }) {
  const { theme, bannerUrl, preview } = useProfileLook();
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  async function onBannerChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    setBannerError(null);
    if (!file) return;
    try {
      const resized = await resizeToWebp(file);
      const files = new DataTransfer();
      files.items.add(resized);
      input.files = files.files;
      preview({ bannerUrl: URL.createObjectURL(resized) });
    } catch {
      input.value = "";
      setBannerError("That image couldn't be used. Try a JPG or PNG.");
    }
  }

  return (
    <Card id="customize" className="scroll-mt-20 p-4">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        <PaletteIcon className="size-5 text-accent" />
        {TERMS.profile.customize}
      </h2>
      <form action={formAction} className="flex flex-col gap-5">
        <Section title="Color">
          <div className="flex flex-wrap gap-2.5">
            {ACCENTS.map((accent) => (
              <label key={accent} className="cursor-pointer">
                <input
                  type="radio"
                  name="accent"
                  value={accent}
                  aria-label={accent}
                  defaultChecked={accent === theme.accent}
                  onChange={() => preview({ theme: { ...theme, accent } })}
                  className="peer sr-only"
                />
                <span className={swatch} style={{ backgroundColor: accentColor(accent) }} />
              </label>
            ))}
          </div>
        </Section>

        <Section title="Background">
          <div className="flex flex-wrap gap-2.5">
            {BACKGROUNDS.map((background) => (
              <label key={background} className="cursor-pointer">
                <input
                  type="radio"
                  name="background"
                  value={background}
                  aria-label={background}
                  defaultChecked={background === theme.background}
                  onChange={() => preview({ theme: { ...theme, background } })}
                  className="peer sr-only"
                />
                <span className={swatch} style={{ backgroundColor: backgroundColor(background) }} />
              </label>
            ))}
          </div>
        </Section>

        <Section title="Font">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3">
            {FONTS.map((font) => (
              <label key={font} className="cursor-pointer">
                <input
                  type="radio"
                  name="font"
                  value={font}
                  defaultChecked={font === theme.font}
                  onChange={() => preview({ theme: { ...theme, font } })}
                  className="peer sr-only"
                />
                <span
                  className="flex flex-col items-center rounded-control border border-border px-2 py-1.5 text-xs transition-colors peer-checked:border-accent peer-checked:bg-accent-soft peer-focus-visible:outline-2 peer-focus-visible:outline-accent"
                  style={{ fontFamily: fontFamily(font) }}
                >
                  <span className="text-lg leading-tight font-bold">Aa</span>
                  {FONT_LABELS[font]}
                </span>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Banner">
          <input
            type="file"
            name="banner"
            accept="image/*"
            aria-label="Banner image"
            onChange={onBannerChange}
            className="text-sm file:mr-3 file:rounded-control file:border file:border-border file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text"
          />
          {bannerError && <p className="text-xs text-danger">{bannerError}</p>}
          {bannerUrl && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="removeBanner"
                onChange={(event) => preview({ bannerUrl: event.currentTarget.checked ? null : profile.bannerUrl })}
                className="accent-accent"
              />
              Remove banner (use my color instead)
            </label>
          )}
        </Section>

        <Section title={TERMS.profile.song}>
          <input name="songTitle" defaultValue={profile.song?.title ?? ""} maxLength={80} placeholder="Song title" aria-label="Song title" className={fieldStyles} />
          <input name="songArtist" defaultValue={profile.song?.artist ?? ""} maxLength={80} placeholder="Artist" aria-label="Artist" className={fieldStyles} />
          <input
            name="songUrl"
            type="url"
            defaultValue={profile.song?.url ?? ""}
            maxLength={500}
            placeholder="https:// link to an audio file (optional)"
            aria-label="Song link"
            className={fieldStyles}
          />
        </Section>

        <details className="group flex flex-col gap-3">
          <summary className={`${sectionTitle} cursor-pointer`}>
            {TERMS.profile.mood}, {TERMS.profile.status.toLowerCase()} and blurbs
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            <input name="mood" defaultValue={profile.mood ?? ""} maxLength={40} placeholder={TERMS.profile.mood} aria-label={TERMS.profile.mood} className={fieldStyles} />
            <input name="status" defaultValue={profile.status ?? ""} maxLength={140} placeholder={TERMS.profile.status} aria-label={TERMS.profile.status} className={fieldStyles} />
            <textarea name="aboutMe" defaultValue={profile.aboutMe ?? ""} maxLength={2000} rows={4} placeholder={TERMS.profile.aboutMe} aria-label={TERMS.profile.aboutMe} className={fieldStyles} />
            <textarea name="wantToMeet" defaultValue={profile.wantToMeet ?? ""} maxLength={1000} rows={3} placeholder={TERMS.profile.wantToMeet} aria-label={TERMS.profile.wantToMeet} className={fieldStyles} />
          </div>
        </details>

        <FormMessage state={state} success="Saved. Your page is updated." />
        <Button type="submit" disabled={isPending} className="self-end">
          {isPending ? "Saving…" : "Save my page"}
        </Button>
      </form>
    </Card>
  );
}
