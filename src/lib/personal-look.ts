import { ACCENTS, type AccentId } from "@/lib/palette";

/**
 * Site-wide personal look, saved per device (localStorage) and applied as
 * data attributes on <html> before first paint, so there's no flash.
 */
/** Dark is the default look; light and system are opt-in. */
export const THEME_MODES = ["dark", "light", "system"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const DENSITIES = ["roomy", "compact"] as const;
export type Density = (typeof DENSITIES)[number];

export interface PersonalLook {
  theme: ThemeMode;
  density: Density;
  accent: AccentId;
}

export const DEFAULT_LOOK: PersonalLook = { theme: "dark", density: "roomy", accent: "violet" };

export const LOOK_STORAGE_KEY = "valid-look";

export function readLook(raw: string | null): PersonalLook {
  try {
    const value = JSON.parse(raw ?? "{}") as Partial<Record<keyof PersonalLook, string>>;
    return {
      theme: THEME_MODES.find((mode) => mode === value.theme) ?? DEFAULT_LOOK.theme,
      density: DENSITIES.find((density) => density === value.density) ?? DEFAULT_LOOK.density,
      accent: ACCENTS.find((accent) => accent === value.accent) ?? DEFAULT_LOOK.accent,
    };
  } catch {
    return DEFAULT_LOOK;
  }
}

export function applyLook(look: PersonalLook, root: HTMLElement): void {
  root.dataset.theme = look.theme;
  root.dataset.density = look.density;
  root.dataset.accent = look.accent;
}

/** Inline <head> script: same as readLook + applyLook, before React loads. */
export const LOOK_BOOT_SCRIPT = `try{var l=JSON.parse(localStorage.getItem(${JSON.stringify(
  LOOK_STORAGE_KEY,
)})||"{}"),d=document.documentElement;["theme","density","accent"].forEach(function(k){if(typeof l[k]==="string")d.dataset[k]=l[k]})}catch(e){}`;
