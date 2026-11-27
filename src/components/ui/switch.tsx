import type { ReactNode } from "react";

interface SwitchProps {
  name: string;
  label: ReactNode;
  description?: ReactNode;
}

/** Accessible on/off switch built on a native checkbox, so it works in plain forms. */
export function Switch({ name, label, description }: SwitchProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="text-xs text-text-muted">{description}</span>}
      </span>
      <input type="checkbox" name={name} className="peer sr-only" />
      <span
        aria-hidden
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-surface-muted ring-1 ring-border transition-colors
          after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition-transform
          peer-checked:bg-accent peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
      />
    </label>
  );
}
