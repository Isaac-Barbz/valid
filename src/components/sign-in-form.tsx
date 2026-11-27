"use client";

import { useActionState } from "react";

import { signInWithEmail, signInWithGoogle } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { fieldStyles } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";

export function SignInForm() {
  const [emailState, emailAction, emailPending] = useActionState(signInWithEmail, null);
  const [googleState, googleAction, googlePending] = useActionState(signInWithGoogle, null);

  return (
    <div className="flex flex-col gap-5">
      <form action={googleAction} className="flex flex-col gap-2">
        <Button type="submit" variant="secondary" disabled={googlePending} className="w-full">
          Continue with Google
        </Button>
        <FormMessage state={googleState} />
      </form>

      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={emailAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Email</span>
          <input type="email" name="email" required autoComplete="email" placeholder="you@example.com" className={fieldStyles} />
        </label>
        <Button type="submit" disabled={emailPending} className="w-full">
          {emailPending ? "Sending…" : "Email me a sign-in link"}
        </Button>
        <FormMessage state={emailState} success="Check your inbox for a sign-in link." />
      </form>
    </div>
  );
}
