"use client";

import { useActionState } from "react";

import { setHomeCommunity } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { fieldStyles } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { DEFAULT_COMMUNITY } from "@/lib/config";
import { TERMS } from "@/lib/copy";
import type { Community } from "@/lib/types";

export function HomeCommunityForm({ communities, current }: { communities: Community[]; current: string | null }) {
  const [state, formAction, isPending] = useActionState(setHomeCommunity, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{TERMS.community.home}</span>
        <span className="text-xs text-text-muted">
          New {TERMS.post.many} start here. Without one they go to {TERMS.community.prefix}
          {DEFAULT_COMMUNITY}.
        </span>
        <div className="flex gap-2">
          <select name="community" defaultValue={current ?? ""} className={fieldStyles}>
            <option value="">
              None ({TERMS.community.prefix}
              {DEFAULT_COMMUNITY})
            </option>
            {communities
              .filter((community) => community.slug !== DEFAULT_COMMUNITY)
              .map((community) => (
                <option key={community.slug} value={community.slug}>
                  {TERMS.community.prefix}
                  {community.slug}
                </option>
              ))}
          </select>
          <Button type="submit" variant="secondary" disabled={isPending}>
            Save
          </Button>
        </div>
      </label>
      <FormMessage state={state} success="Saved." />
    </form>
  );
}
