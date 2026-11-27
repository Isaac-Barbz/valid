"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { castVote } from "@/app/actions";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import { isSupabaseConfigured } from "@/lib/config";
import { compactNumber } from "@/lib/format";
import type { VoteValue } from "@/lib/types";

interface VoteControlProps {
  target: "post" | "comment";
  id: string;
  score: number;
  viewerVote: VoteValue;
  layout?: "column" | "row";
}

/**
 * Up/down voting with an optimistic count. In demo mode votes stay local to
 * the page; otherwise they are saved and rolled back if saving fails.
 */
export function VoteControl({ target, id, score, viewerVote, layout = "column" }: VoteControlProps) {
  const router = useRouter();
  const [vote, setVote] = useState<VoteValue>(viewerVote);
  const [isPending, startTransition] = useTransition();
  const shownScore = score - viewerVote + vote;

  function choose(next: VoteValue) {
    const value: VoteValue = vote === next ? 0 : next;
    const previous = vote;
    setVote(value);
    if (!isSupabaseConfigured) return;

    startTransition(async () => {
      const result = await castVote({ target, id, value });
      if (result.ok) return;
      setVote(previous);
      if (result.needsSignIn) router.push("/signin");
    });
  }

  const arrow = "rounded-full p-1.5 transition-colors hover:bg-surface-muted disabled:opacity-60";

  return (
    <div className={`flex items-center gap-0.5 ${layout === "column" ? "flex-col" : "flex-row"}`}>
      <button
        type="button"
        onClick={() => choose(1)}
        disabled={isPending}
        aria-label="Upvote"
        aria-pressed={vote === 1}
        className={`${arrow} ${vote === 1 ? "text-upvote" : "text-text-muted hover:text-upvote"}`}
      >
        <ArrowUpIcon className="size-4" />
      </button>
      <span
        className={`min-w-8 text-center text-sm font-semibold tabular-nums ${
          vote === 1 ? "text-upvote" : vote === -1 ? "text-downvote" : "text-text"
        }`}
      >
        {compactNumber(shownScore)}
      </span>
      <button
        type="button"
        onClick={() => choose(-1)}
        disabled={isPending}
        aria-label="Downvote"
        aria-pressed={vote === -1}
        className={`${arrow} ${vote === -1 ? "text-downvote" : "text-text-muted hover:text-downvote"}`}
      >
        <ArrowDownIcon className="size-4" />
      </button>
    </div>
  );
}
