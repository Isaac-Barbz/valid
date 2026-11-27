"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/space-editor/image-upload";
import type { SpaceDraft, UpdateLayout } from "@/components/space-editor/state";
import {
  BACKDROPS,
  CARD_SHAPES,
  CARD_STYLES,
  fontFamily,
  FONT_LABELS,
  FONTS,
  PATTERNS,
  spaceStyle,
  DEFAULT_LAYOUT,
} from "@/lib/profile-layout";

const SHAPE_LABELS = { rounded: "Rounded", sharp: "Sharp" } as const;
const STYLE_LABELS = { flat: "Flat", outlined: "Outlined", shadow: "Shadow" } as const;
const BACKDROP_LABELS = { solid: "Solid", pattern: "Pattern", photo: "Photo" } as const;
const PATTERN_LABELS = { dots: "Dots", grid: "Grid", diagonal: "Lines", checks: "Checks" } as const;

function Choices<T extends string>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  render: (option: T) => ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className="rounded-control border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent"
          >
            {render(option)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function StyleTab({
  draft,
  updateLayout,
  mediaUrls,
  bannerUrl,
  onUploaded,
  onBanner,
}: {
  draft: SpaceDraft;
  updateLayout: UpdateLayout;
  mediaUrls: Record<string, string>;
  bannerUrl: string | null;
  onUploaded: (path: string, url: string) => void;
  onBanner: (path: string | null, url: string | null) => void;
}) {
  const { layout } = draft;

  return (
    <div className="flex flex-col gap-5">
      <Choices
        label="Font"
        options={FONTS}
        value={layout.font}
        onChange={(font) => updateLayout({ font })}
        render={(font) => <span style={{ fontFamily: fontFamily(font) }}>{FONT_LABELS[font]}</span>}
      />
      <Choices
        label="Card shape"
        options={CARD_SHAPES}
        value={layout.cardShape}
        onChange={(cardShape) => updateLayout({ cardShape })}
        render={(shape) => SHAPE_LABELS[shape]}
      />
      <Choices
        label="Card style"
        options={CARD_STYLES}
        value={layout.cardStyle}
        onChange={(cardStyle) => updateLayout({ cardStyle })}
        render={(style) => STYLE_LABELS[style]}
      />
      <Choices
        label="Background"
        options={BACKDROPS}
        value={layout.backdrop.kind}
        onChange={(kind) => updateLayout({ backdrop: { ...layout.backdrop, kind } })}
        render={(kind) => BACKDROP_LABELS[kind]}
      />
      {layout.backdrop.kind === "pattern" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold">Pattern</legend>
          <div className="grid grid-cols-4 gap-2">
            {PATTERNS.map((pattern) => (
              <button
                key={pattern}
                type="button"
                aria-pressed={layout.backdrop.pattern === pattern}
                onClick={() => updateLayout({ backdrop: { ...layout.backdrop, pattern } })}
                className="flex flex-col items-center gap-1 rounded-control border border-border p-1.5 text-xs aria-pressed:border-accent aria-pressed:text-accent"
              >
                <span
                  aria-hidden
                  className="block h-10 w-full rounded bg-bg"
                  style={spaceStyle({ ...DEFAULT_LAYOUT, backdrop: { kind: "pattern", pattern, photoPath: null } }, null)}
                />
                {PATTERN_LABELS[pattern]}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {layout.backdrop.kind === "photo" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Background photo</p>
          {layout.backdrop.photoPath && mediaUrls[layout.backdrop.photoPath] && (
            <p className="text-xs text-text-muted">Photo set. Upload another to replace it.</p>
          )}
          <ImageUpload
            kind="backdrop"
            label="Upload background"
            onUploaded={(path, url) => {
              onUploaded(path, url);
              updateLayout({ backdrop: { ...layout.backdrop, photoPath: path } });
            }}
          />
        </div>
      )}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-sm font-semibold">Banner</p>
        <div className="flex flex-wrap items-center gap-2">
          <ImageUpload kind="banner" label={bannerUrl ? "Change banner" : "Upload banner"} onUploaded={onBanner} />
          {draft.bannerPath && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onBanner(null, null)}
            >
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-text-muted">Without a banner, the top of your space uses your accent color.</p>
      </div>
    </div>
  );
}
