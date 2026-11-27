"use client";

import { useSyncExternalStore } from "react";

import { TERMS } from "@/lib/copy";
import { ACCENTS, accentColor, type AccentId } from "@/lib/palette";
import {
  applyLook,
  DENSITIES,
  LOOK_STORAGE_KEY,
  readLook,
  THEME_MODES,
  type PersonalLook,
} from "@/lib/personal-look";

const THEME_LABELS = { dark: "Dark", light: "Light", system: "System" } as const;
const DENSITY_LABELS = { roomy: "Roomy", compact: "Compact" } as const;

function Segmented<T extends string>({
  name,
  label,
  options,
  labels,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="flex gap-1 rounded-control bg-surface-muted p-1">
        {options.map((option) => (
          <label
            key={option}
            className="flex-1 cursor-pointer rounded-control px-3 py-1.5 text-center text-sm font-medium text-text-muted has-checked:bg-surface has-checked:text-text has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-accent"
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {labels[option]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const LOOK_CHANGED = "valid-look-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LOOK_CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOOK_CHANGED, onChange);
  };
}

/** Theme, feed density, and accent for this device. Saved instantly to localStorage. */
export function LookSettings() {
  // `undefined` while server rendering: the saved look only exists in the browser.
  const stored = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(LOOK_STORAGE_KEY),
    () => undefined,
  );
  if (stored === undefined) return <div className="h-64 animate-pulse rounded-control bg-surface-muted" />;
  const look = readLook(stored);

  function update(next: Partial<PersonalLook>) {
    const merged = { ...look, ...next };
    localStorage.setItem(LOOK_STORAGE_KEY, JSON.stringify(merged));
    applyLook(merged, document.documentElement);
    window.dispatchEvent(new Event(LOOK_CHANGED));
  }

  return (
    <div className="flex flex-col gap-5">
      <Segmented
        name="theme"
        label={TERMS.settings.theme}
        options={THEME_MODES}
        labels={THEME_LABELS}
        value={look.theme}
        onChange={(theme) => update({ theme })}
      />
      <Segmented
        name="density"
        label={TERMS.settings.density}
        options={DENSITIES}
        labels={DENSITY_LABELS}
        value={look.density}
        onChange={(density) => update({ density })}
      />
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{TERMS.settings.accent}</legend>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((accent: AccentId) => (
            <label key={accent} className="cursor-pointer">
              <input
                type="radio"
                name="accent"
                value={accent}
                checked={look.accent === accent}
                onChange={() => update({ accent })}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="block size-9 rounded-full border-2 border-surface ring-2 ring-transparent peer-checked:ring-text peer-focus-visible:ring-accent"
                style={{ backgroundColor: accentColor(accent) }}
              />
              <span className="sr-only">{accent}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
