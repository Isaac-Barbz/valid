import type { Metadata } from "next";

import { CheckBadgeIcon } from "@/components/icons";
import { SignInForm } from "@/components/sign-in-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Card className="flex flex-col gap-6 p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <CheckBadgeIcon className="size-10 text-accent" />
          <h1 className="text-xl font-bold">Sign in to Valid</h1>
          <p className="text-sm text-text-muted">
            One account. Post as yourself or anonymously, your call every time.
          </p>
        </div>
        <SignInForm />
      </Card>
    </main>
  );
}
