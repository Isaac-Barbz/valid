"use client";

import { useActionState, useRef } from "react";

import { addWallComment } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { fieldStyles } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { TERMS } from "@/lib/copy";
import type { ActionResult } from "@/lib/types";

export function WallForm({ username, name }: { username: string; name: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(async (prev: ActionResult | null, formData: FormData) => {
    const result = await addWallComment(prev, formData);
    if (result.ok) formRef.current?.reset();
    return result;
  }, null);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="username" value={username} />
      <div className="flex gap-2">
        <input
          name="body"
          required
          maxLength={1000}
          placeholder={`Leave a ${TERMS.comment.one} for ${name}…`}
          aria-label={`Leave a ${TERMS.comment.one} for ${name}`}
          className={fieldStyles}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Sending…" : "Send"}
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
