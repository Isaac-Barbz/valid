"use client";

import { Button } from "@/components/ui/button";
import { fieldStyles } from "@/components/ui/field";
import { isHex, type Hex } from "@/lib/color";
import {
  COLOR_PRESETS,
  COLOR_ROLES,
  contrastIssues,
  fixContrast,
  STARTER_COLORS,
  type SpaceColors,
} from "@/lib/profile-layout";

const ROLE_LABELS: Record<keyof SpaceColors, string> = {
  accent: "Accent",
  background: "Background",
  card: "Cards",
  text: "Text",
};

function ColorField({ role, value, onChange }: { role: keyof SpaceColors; value: Hex; onChange: (hex: Hex) => void }) {
  const id = `color-${role}`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {ROLE_LABELS[role]}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => isHex(event.target.value) && onChange(event.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-control border border-border bg-surface p-1"
        />
        <input
          aria-label={`${ROLE_LABELS[role]} hex code`}
          defaultValue={value}
          key={value}
          maxLength={7}
          spellCheck={false}
          onBlur={(event) => {
            const hex = event.target.value.trim().toLowerCase();
            if (isHex(hex)) onChange(hex);
          }}
          className={`${fieldStyles} w-28 font-mono`}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {COLOR_PRESETS[role].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            aria-label={`${ROLE_LABELS[role]} ${preset}`}
            aria-pressed={preset === value}
            className="size-7 rounded-full border border-border aria-pressed:ring-2 aria-pressed:ring-text aria-pressed:ring-offset-2 aria-pressed:ring-offset-surface"
            style={{ backgroundColor: preset }}
          />
        ))}
      </div>
    </div>
  );
}

/** Any color for each role, with a live WCAG AA contrast check (and one-tap fix). */
export function ColorsTab({ colors, onChange }: { colors: SpaceColors | null; onChange: (colors: SpaceColors | null) => void }) {
  const issues = colors ? contrastIssues(colors) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-control bg-surface-muted p-1 text-sm font-medium">
        <button
          type="button"
          aria-pressed={colors === null}
          onClick={() => onChange(null)}
          className="flex-1 rounded-control px-3 py-1.5 text-text-muted aria-pressed:bg-surface aria-pressed:text-text aria-pressed:shadow-sm"
        >
          Site colors
        </button>
        <button
          type="button"
          aria-pressed={colors !== null}
          onClick={() => onChange(colors ?? STARTER_COLORS)}
          className="flex-1 rounded-control px-3 py-1.5 text-text-muted aria-pressed:bg-surface aria-pressed:text-text aria-pressed:shadow-sm"
        >
          My colors
        </button>
      </div>

      {colors === null ? (
        <p className="text-sm text-text-muted">Your space follows the site&apos;s colors and each visitor&apos;s light or dark mode.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {COLOR_ROLES.map((role) => (
              <ColorField key={role} role={role} value={colors[role]} onChange={(hex) => onChange({ ...colors, [role]: hex })} />
            ))}
          </div>
          {issues.length > 0 ? (
            <div role="status" className="flex flex-col gap-2 rounded-control border border-danger/40 bg-danger/5 p-3 text-sm">
              <p className="font-semibold text-danger">Some text may be hard to read</p>
              <ul className="list-disc pl-5 text-text">
                {issues.map((issue) => (
                  <li key={`${issue.role}-${issue.against}`}>
                    {ROLE_LABELS[issue.role]} on {ROLE_LABELS[issue.against].toLowerCase()}: {issue.ratio.toFixed(1)}:1 (needs{" "}
                    {issue.needed}:1)
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="secondary" className="self-start" onClick={() => onChange(fixContrast(colors))}>
                Fix contrast
              </Button>
              <p className="text-xs text-text-muted">We&apos;ll also adjust it automatically when you save.</p>
            </div>
          ) : (
            <p role="status" className="text-sm font-medium text-success">
              ✓ Passes WCAG AA contrast
            </p>
          )}
        </>
      )}
    </div>
  );
}
