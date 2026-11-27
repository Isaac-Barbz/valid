import { AuthorLabel } from "@/components/author-label";
import { ReplyToggle } from "@/components/reply-toggle";
import { ReportButton } from "@/components/report-button";
import { VoteControl } from "@/components/vote-control";
import { timeAgo } from "@/lib/format";
import type { CommentNode } from "@/lib/types";

function CommentItem({ comment }: { comment: CommentNode }) {
  return (
    <li className="flex flex-col gap-1">
      <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-text-muted">
        {comment.isRemoved ? <span>[removed]</span> : <AuthorLabel author={comment.author} />}
        <span aria-hidden>·</span>
        <time dateTime={comment.createdAt}>{timeAgo(comment.createdAt)}</time>
      </p>
      <p className={`text-sm whitespace-pre-line ${comment.isRemoved ? "text-text-muted italic" : ""}`}>
        {comment.isRemoved ? "This comment was removed by a moderator." : comment.body}
      </p>
      {!comment.isRemoved && (
        <div className="-ml-1.5 flex flex-wrap items-center gap-1">
          <VoteControl
            target="comment"
            id={comment.id}
            score={comment.score}
            viewerVote={comment.viewerVote}
            layout="row"
          />
          <ReplyToggle postId={comment.postId} commentId={comment.id} />
          <ReportButton target="comment" id={comment.id} />
        </div>
      )}
      {comment.replies.length > 0 && (
        <ul className="mt-1 flex flex-col gap-4 border-l-2 border-border pl-3 sm:pl-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CommentThread({ comments }: { comments: CommentNode[] }) {
  if (comments.length === 0) {
    return <p className="py-6 text-center text-sm text-text-muted">No comments yet. Start the conversation.</p>;
  }
  return (
    <ul className="flex flex-col gap-5">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </ul>
  );
}
