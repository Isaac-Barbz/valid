"use client";

import { DEMO_MODE_MESSAGE, isSupabaseConfigured } from "@/lib/config";
import { COMMUNITY_PREFS_EVENT, DEMO_AS_STORAGE_KEY, readDemoAs } from "@/lib/community-prefs";
import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COMMUNITY_PREFS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COMMUNITY_PREFS_EVENT, onChange);
  };
}

/** Demo-only: switch the shortcut row between the demo person and a signed-out visitor. */
function PreviewAs() {
  const stored = useSyncExternalStore(subscribe, () => localStorage.getItem(DEMO_AS_STORAGE_KEY), () => undefined);
  const mode = readDemoAs(stored ?? null);

  function setMode(next: "you" | "signed-out") {
    if (next === "you") localStorage.removeItem(DEMO_AS_STORAGE_KEY);
    else localStorage.setItem(DEMO_AS_STORAGE_KEY, "signed-out");
    const root = document.documentElement;
    if (next === "signed-out") root.dataset.demoAs = "signed-out";
    else delete root.dataset.demoAs;
    window.dispatchEvent(new Event(COMMUNITY_PREFS_EVENT));
  }

  return (
    <span className="mt-1 block">
      Preview as{" "}
      <button
        type="button"
        onClick={() => setMode("you")}
        aria-pressed={mode === "you"}
        className="underline-offset-2 hover:underline aria-pressed:font-bold aria-pressed:no-underline"
      >
        you
      </button>
      {" · "}
      <button
        type="button"
        onClick={() => setMode("signed-out")}
        aria-pressed={mode === "signed-out"}
        className="underline-offset-2 hover:underline aria-pressed:font-bold aria-pressed:no-underline"
      >
        signed out
      </button>
    </span>
  );
}

export function DemoBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <p className="bg-warning-soft px-4 py-2 text-center text-xs font-medium text-on-warning-soft">
      {DEMO_MODE_MESSAGE}{" "}
      <PreviewAs />
    </p>
  );
}
