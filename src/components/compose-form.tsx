"use client";

import { useActionState } from "react";

import { createPost } from "@/app/actions";
import { MaskIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { fieldStyles } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Switch } from "@/components/ui/switch";
import type { Community } from "@/lib/types";

interface ComposeFormProps {
  communities: Pick<Community, "slug" | "name">[];
  defaultCommunity?: string;
}

export function ComposeForm({ communities, defaultCommunity }: ComposeFormProps) {
  const [state, formAction, isPending] = useActionState(createPost, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Community</span>
        <select name="community" required defaultValue={defaultCommunity ?? ""} className={fieldStyles}>
          <option value="" disabled>
            Choose a community
          </option>
          {communities.map((community) => (
            <option key={community.slug} value={community.slug}>
              c/{community.slug} · {community.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Title</span>
        <input name="title" required maxLength={300} placeholder="What's on your mind?" className={fieldStyles} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">
          Body <span className="font-normal text-text-muted">(optional)</span>
        </span>
        <textarea name="body" rows={6} maxLength={40000} placeholder="Add details…" className={fieldStyles} />
      </label>
      <div className="rounded-control border border-border bg-surface-muted p-3">
        <Switch
          name="anonymous"
          label={
            <span className="inline-flex items-center gap-1.5">
              <MaskIcon className="size-4" />
              Post anonymously
            </span>
          }
          description="Shows as “Anonymous” to everyone. Moderators can still act on it."
        />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={isPending} className="self-end">
        {isPending ? "Posting…" : "Post"}
      </Button>
    </form>
  );
}
