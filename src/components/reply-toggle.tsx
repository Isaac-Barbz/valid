"use client";

import { useState } from "react";

import { CommentForm } from "@/components/comment-form";
import { CommentIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function ReplyToggle({ postId, commentId }: { postId: string; commentId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <CommentIcon className="size-4" />
        Reply
      </Button>
    );
  }
  return (
    <div className="basis-full py-2">
      <CommentForm postId={postId} parentId={commentId} onDone={() => setOpen(false)} autoFocus />
    </div>
  );
}
