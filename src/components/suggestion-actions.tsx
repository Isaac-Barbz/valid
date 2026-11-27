"use client";

import { useState, useTransition } from "react";

import { decideSuggestion } from "@/app/actions";
import { Button } from "@/components/ui/button";

/** Accept a v/thestreets drop into this community's feed, or dismiss it from the queue. */
export function SuggestionActions({ community, postId }: { community: string; postId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function decide(decision: "accepted" | "dismissed") {
    setError(null);
    startTransition(async () => {
      const result = await decideSuggestion({ community, postId, decision });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" disabled={isPending} onClick={() => decide("accepted")}>
        Accept
      </Button>
      <Button size="sm" variant="ghost" disabled={isPending} onClick={() => decide("dismissed")}>
        Dismiss
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
