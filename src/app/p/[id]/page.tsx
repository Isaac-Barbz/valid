import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CommentForm } from "@/components/comment-form";
import { CommentThread } from "@/components/comment-thread";
import { FeedSkeleton } from "@/components/feed";
import { FeedLayout } from "@/components/feed-layout";
import { PostCard } from "@/components/post-card";
import { Card } from "@/components/ui/card";
import { getCommentTree, getPost } from "@/lib/data";
import { capitalize, TERMS } from "@/lib/copy";

async function PostContent({ params }: Pick<PageProps<"/p/[id]">, "params">) {
  const { id } = await params;
  const [post, comments] = await Promise.all([getPost(id), getCommentTree(id)]);
  if (!post) notFound();

  return (
    <>
      <PostCard post={post} expanded />
      <Card className="flex flex-col gap-6 p-4">
        <section aria-label={`Add a ${TERMS.comment.one}`}>
          <CommentForm postId={post.id} />
        </section>
        <section aria-label={capitalize(TERMS.comment.many)}>
          <CommentThread comments={comments} />
        </section>
      </Card>
    </>
  );
}

export default function PostPage({ params }: PageProps<"/p/[id]">) {
  return (
    <FeedLayout>
      <Suspense fallback={<FeedSkeleton />}>
        <PostContent params={params} />
      </Suspense>
    </FeedLayout>
  );
}
