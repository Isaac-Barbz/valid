"use client";

import { useActionState } from "react";

import { changeClaimedTag } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { fieldStyles } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { TERMS } from "@/lib/copy";

/** Moderators add or drop the #tags their community claims. */
export function ClaimedTagsEditor({ community, tags }: { community: string; tags: string[] }) {
  const [state, formAction, isPending] = useActionState(changeClaimedTag, null);

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <li key={tag}>
            <form action={formAction}>
              <input type="hidden" name="community" value={community} />
              <input type="hidden" name="tag" value={tag} />
              <input type="hidden" name="action" value="release" />
              <button
                type="submit"
                disabled={isPending}
                aria-label={`Remove ${TERMS.tag.prefix}${tag}`}
                className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent hover:text-on-accent"
              >
                {TERMS.tag.prefix}
                {tag}
                <span aria-hidden>×</span>
              </button>
            </form>
          </li>
        ))}
      </ul>
      <form action={formAction} className="flex gap-2">
        <input type="hidden" name="community" value={community} />
        <input type="hidden" name="action" value="claim" />
        <input
          name="tag"
          required
          maxLength={33}
          placeholder={`Claim a ${TERMS.tag.one}, like ${TERMS.tag.prefix}braids`}
          aria-label={`Claim a ${TERMS.tag.one}`}
          className={`${fieldStyles} h-8 py-1`}
        />
        <Button type="submit" size="sm" variant="secondary" disabled={isPending}>
          Add
        </Button>
      </form>
      <FormMessage state={state} />
    </div>
  );
}
