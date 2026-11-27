"use client";

import { useActionState, useRef } from "react";

import { submitReport } from "@/app/actions";
import { FlagIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { fieldStyles } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { REPORT_REASONS } from "@/lib/types";

interface ReportButtonProps {
  target: "post" | "comment";
  id: string;
}

export function ReportButton({ target, id }: ReportButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, isPending] = useActionState(submitReport, null);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => dialogRef.current?.showModal()}>
        <FlagIcon className="size-4" />
        Report
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`report-${id}`}
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-card border border-border bg-surface p-0 text-text backdrop:bg-black/50"
      >
        {state?.ok ? (
          <div className="flex flex-col gap-4 p-5">
            <h2 id={`report-${id}`} className="text-lg font-semibold">
              Thanks for reporting
            </h2>
            <p className="text-sm text-text-muted">Moderators will review this {target}.</p>
            <Button className="self-end" onClick={() => dialogRef.current?.close()}>
              Done
            </Button>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4 p-5">
            <h2 id={`report-${id}`} className="text-lg font-semibold">
              Report this {target}
            </h2>
            <input type="hidden" name="target" value={target} />
            <input type="hidden" name="id" value={id} />
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm text-text-muted">What&apos;s wrong with it?</legend>
              {REPORT_REASONS.map((reason) => (
                <label key={reason.value} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="reason" value={reason.value} required className="accent-accent" />
                  {reason.label}
                </label>
              ))}
            </fieldset>
            <textarea name="details" rows={3} placeholder="Anything moderators should know? (optional)" className={fieldStyles} />
            <FormMessage state={state} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Sending…" : "Send report"}
              </Button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
