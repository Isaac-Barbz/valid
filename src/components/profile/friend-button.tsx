"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { changeFriendship } from "@/app/actions";
import { CheckIcon, UserPlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { TERMS } from "@/lib/copy";
import type { Friendship } from "@/lib/types";

interface FriendButtonProps {
  username: string;
  /** `null` when signed out. */
  friendship: Friendship | null;
}

/** Add / accept / unfriend, with an inline error when it can't be saved. */
export function FriendButton({ username, friendship }: FriendButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (friendship === "self") return null;

  function run(action: "request" | "accept" | "remove") {
    if (friendship === null) {
      router.push("/signin");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await changeFriendship({ username, action });
      if (result.ok) return;
      if (result.needsSignIn) router.push("/signin");
      else setError(result.error);
    });
  }

  const button =
    friendship === "friends" ? (
      <Button
        variant="secondary"
        onClick={() => window.confirm(`${TERMS.friend.remove} ${username}?`) && run("remove")}
        disabled={isPending}
      >
        <CheckIcon className="size-4" />
        {TERMS.friend.isFriend}
      </Button>
    ) : friendship === "outgoing" ? (
      <Button variant="secondary" onClick={() => run("remove")} disabled={isPending} title="Cancel request">
        {TERMS.friend.requested}
      </Button>
    ) : friendship === "incoming" ? (
      <Button onClick={() => run("accept")} disabled={isPending}>
        <CheckIcon className="size-4" />
        {TERMS.friend.accept}
      </Button>
    ) : (
      <Button onClick={() => run("request")} disabled={isPending}>
        <UserPlusIcon className="size-4" />
        {TERMS.friend.add}
      </Button>
    );

  return (
    <>
      {button}
      {error && (
        <p role="alert" className="basis-full text-xs text-danger">
          {error}
        </p>
      )}
    </>
  );
}
