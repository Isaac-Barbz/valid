"use client";

import { useState, useSyncExternalStore } from "react";

import { setShowCommunityRow } from "@/app/actions";
import { Toggle } from "@/components/ui/toggle";
import {
  COMMUNITY_PREFS_EVENT,
  readShowRow,
  SHOW_ROW_STORAGE_KEY,
} from "@/lib/community-prefs";
import { DEFAULT_COMMUNITY } from "@/lib/config";
import { TERMS } from "@/lib/copy";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COMMUNITY_PREFS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COMMUNITY_PREFS_EVENT, onChange);
  };
}

/**
 * Show or hide the feed shortcut row. Signed-in accounts save this on the
 * profile; demo and signed-out keep it in localStorage.
 */
export function CommunityRowSetting({ accountValue }: { accountValue: boolean | null }) {
  const stored = useSyncExternalStore(subscribe, () => localStorage.getItem(SHOW_ROW_STORAGE_KEY), () => null);
  const [error, setError] = useState<string | null>(null);
  const checked = stored !== null ? readShowRow(stored) : (accountValue ?? true);

  function apply(show: boolean) {
    setError(null);
    localStorage.setItem(SHOW_ROW_STORAGE_KEY, String(show));
    const root = document.documentElement;
    if (show) delete root.dataset.communityRow;
    else root.dataset.communityRow = "off";
    window.dispatchEvent(new Event(COMMUNITY_PREFS_EVENT));
    if (accountValue !== null) {
      void setShowCommunityRow({ show }).then((result) => {
        if (!result.ok) setError(result.error);
      });
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Toggle
        checked={checked}
        onChange={apply}
        label={TERMS.community.showRow}
        description={`The shortcut row on the feed: ${TERMS.community.prefix}${DEFAULT_COMMUNITY} and ${TERMS.community.many} you've joined.`}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
