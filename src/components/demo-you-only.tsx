"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { COMMUNITY_PREFS_EVENT, DEMO_AS_STORAGE_KEY, readDemoAs } from "@/lib/community-prefs";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COMMUNITY_PREFS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COMMUNITY_PREFS_EVENT, onChange);
  };
}

/** Hides demo-only "you" chrome when the banner is set to Preview as signed out. */
export function DemoYouOnly({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(subscribe, () => localStorage.getItem(DEMO_AS_STORAGE_KEY), () => undefined);
  if (readDemoAs(stored ?? null) === "signed-out") return null;
  return <div className="demo-you-only">{children}</div>;
}
