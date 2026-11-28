"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";

import { changeMembership } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { DEFAULT_COMMUNITY } from "@/lib/config";
import {
  COMMUNITY_PREFS_EVENT,
  DEMO_AS_STORAGE_KEY,
  DEMO_MEMBERSHIPS_STORAGE_KEY,
  readDemoAs,
  readDemoMemberships,
  toggleDemoMembership,
} from "@/lib/community-prefs";
import { TERMS } from "@/lib/copy";
import type { MemberRole } from "@/lib/types";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COMMUNITY_PREFS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COMMUNITY_PREFS_EVENT, onChange);
  };
}

interface MembershipButtonProps {
  community: string;
  /** Membership as stored on the server (or the demo seed). */
  role: MemberRole | null;
  /** `device` is demo mode; the button writes localStorage instead of the database. */
  persist: "account" | "device";
  signedIn: boolean;
}

/** Join or leave a community. v/thestreets is open to everyone, so it has no button. */
export function MembershipButton({ community, role, persist, signedIn }: MembershipButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const storedAs = useSyncExternalStore(subscribe, () => localStorage.getItem(DEMO_AS_STORAGE_KEY), () => null);
  const storedMembers = useSyncExternalStore(subscribe, () => localStorage.getItem(DEMO_MEMBERSHIPS_STORAGE_KEY), () => null);

  if (community === DEFAULT_COMMUNITY) return null;

  const signedOutPreview = persist === "device" && readDemoAs(storedAs) === "signed-out";
  const overlay = readDemoMemberships(storedMembers);
  const effectiveRole =
    persist === "device"
      ? overlay.left.includes(community)
        ? null
        : overlay.joined.includes(community)
          ? "member"
          : role
      : role;
  const signedOut = !signedIn || signedOutPreview;

  function run(action: "join" | "leave") {
    if (signedOut) {
      router.push("/signin");
      return;
    }
    setError(null);
    startTransition(async () => {
      if (persist === "device") {
        const next = toggleDemoMembership(overlay, community, action === "join");
        localStorage.setItem(DEMO_MEMBERSHIPS_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(COMMUNITY_PREFS_EVENT));
        return;
      }
      const result = await changeMembership({ community, action });
      if (result.ok) return;
      if (result.needsSignIn) router.push("/signin");
      else setError(result.error);
    });
  }

  if (effectiveRole === "owner") {
    return <p className="text-xs text-text-muted">Owner</p>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {effectiveRole ? (
        <Button size="sm" variant="secondary" disabled={isPending} onClick={() => run("leave")}>
          {isPending ? "Leaving…" : TERMS.community.leave}
        </Button>
      ) : (
        <Button size="sm" variant="secondary" disabled={isPending} onClick={() => run("join")}>
          {isPending ? "Joining…" : TERMS.community.join}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
