"use client";

import { useActionState, useMemo, useState } from "react";

import { createPost } from "@/app/actions";
import { MaskIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { fieldStyles } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_COMMUNITY } from "@/lib/config";
import { capitalize, TERMS } from "@/lib/copy";
import { suggestCommunities } from "@/lib/suggest";
import { extractTags } from "@/lib/tags";
import type { CommunityWithTags } from "@/lib/types";

interface ComposeFormProps {
  communities: CommunityWithTags[];
  defaultCommunity: string;
}

/** Matches MAX_ALSO in actions.ts and the limit_author_listings trigger. */
const MAX_ALSO = 3;

export function ComposeForm({ communities, defaultCommunity }: ComposeFormProps) {
  const [state, formAction, isPending] = useActionState(createPost, null);
  const [community, setCommunity] = useState(defaultCommunity);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [also, setAlso] = useState<string[]>([]);

  const tags = useMemo(() => extractTags(tagInput, title, body), [tagInput, title, body]);
  const suggestions = useMemo(
    () => suggestCommunities(communities, { title, body, tags }, community),
    [communities, title, body, tags, community],
  );
  // Keep anything already ticked on screen even if it drops out of the top matches.
  const shown = [
    ...suggestions,
    ...also
      .filter((slug) => slug !== community && !suggestions.some((s) => s.community.slug === slug))
      .flatMap((slug) => {
        const match = communities.find((c) => c.slug === slug);
        return match ? [{ community: match, reasons: [] as string[], score: 0 }] : [];
      }),
  ];

  function toggleAlso(slug: string, checked: boolean) {
    setAlso((current) => (checked ? [...current, slug].slice(0, MAX_ALSO) : current.filter((s) => s !== slug)));
  }

  const ordered = [...communities].sort(
    (a, b) => Number(b.slug === DEFAULT_COMMUNITY) - Number(a.slug === DEFAULT_COMMUNITY),
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{capitalize(TERMS.community.one)}</span>
        <select
          name="community"
          required
          value={community}
          onChange={(event) => setCommunity(event.target.value)}
          className={fieldStyles}
        >
          {ordered.map((option) => (
            <option key={option.slug} value={option.slug}>
              {TERMS.community.prefix}
              {option.slug} · {option.name}
            </option>
          ))}
        </select>
        {community === DEFAULT_COMMUNITY && (
          <span className="text-xs text-text-muted">
            Open to everyone. Add {TERMS.tag.many} so the right {TERMS.community.many} can pick it up.
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Title</span>
        <input
          name="title"
          required
          maxLength={300}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What's on your mind?"
          className={fieldStyles}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">
          Body <span className="font-normal text-text-muted">(optional)</span>
        </span>
        <textarea
          name="body"
          rows={5}
          maxLength={40000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add details…"
          className={fieldStyles}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">
          {capitalize(TERMS.tag.many)} <span className="font-normal text-text-muted">(optional)</span>
        </span>
        <input
          name="tags"
          maxLength={400}
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          placeholder="#braids, #silkpress"
          className={fieldStyles}
          aria-describedby="tags-preview"
        />
        <span id="tags-preview" className="flex min-h-5 flex-wrap gap-1.5 text-xs text-text-muted">
          {tags.length === 0
            ? `Separate with commas or spaces. #${TERMS.tag.many} in your text count too.`
            : tags.map((tag) => (
                <span key={tag} className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent">
                  {TERMS.tag.prefix}
                  {tag}
                </span>
              ))}
        </span>
      </label>

      {shown.length > 0 && (
        <fieldset className="flex flex-col gap-2 rounded-control border border-border p-3">
          <legend className="px-1 text-sm font-semibold">Best fit</legend>
          {shown.map(({ community: match, reasons }) => {
            const checked = also.includes(match.slug);
            return (
              <label key={match.slug} className="flex cursor-pointer items-start gap-3 rounded-control p-1.5 hover:bg-surface-muted">
                <input
                  type="checkbox"
                  name="also"
                  value={match.slug}
                  checked={checked}
                  disabled={!checked && also.length >= MAX_ALSO}
                  onChange={(event) => toggleAlso(match.slug, event.target.checked)}
                  className="mt-0.5 size-4 accent-(--accent)"
                />
                <span className="flex flex-col">
                  <span className="text-sm">
                    {TERMS.community.alsoDrop}{" "}
                    <span className="font-semibold">
                      {TERMS.community.prefix}
                      {match.slug}
                    </span>
                  </span>
                  {reasons.length > 0 && (
                    <span className="text-xs text-text-muted">Matches {reasons.join(", ")}</span>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      <div className="rounded-control border border-border bg-surface-muted p-3">
        <Switch
          name="anonymous"
          label={
            <span className="inline-flex items-center gap-1.5">
              <MaskIcon className="size-4" />
              {TERMS.anonymous.toggle}
            </span>
          }
          description={`Shows as “${TERMS.anonymous.label}” to everyone. Moderators can still act on it.`}
        />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={isPending} className="self-end">
        {isPending ? TERMS.post.pending : TERMS.post.action}
      </Button>
    </form>
  );
}
