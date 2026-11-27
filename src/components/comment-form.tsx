"use client";

import { useActionState, useRef } from "react";

import { createComment } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { fieldStyles } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Switch } from "@/components/ui/switch";
import type { ActionResult } from "@/lib/types";
import { TERMS } from "@/lib/copy";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onDone?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({ postId, parentId, onDone, autoFocus }: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await createComment(prev, formData);
      if (result.ok) {
        formRef.current?.reset();
        onDone?.();
      }
      return result;
    },
    null,
  );

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <textarea
        name="body"
        rows={parentId ? 2 : 3}
        required
        maxLength={10000}
        autoFocus={autoFocus}
        placeholder={parentId ? "Write a reply…" : `Add a ${TERMS.comment.one}…`}
        aria-label={parentId ? TERMS.comment.reply : TERMS.comment.action}
        className={fieldStyles}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Switch name="anonymous" label={TERMS.anonymous.label} />
        <div className="flex gap-2">
          {onDone && (
            <Button variant="ghost" size="sm" onClick={onDone}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Sending…" : parentId ? TERMS.comment.reply : TERMS.comment.action}
          </Button>
        </div>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
