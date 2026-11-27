import Link from "next/link";

import { MaskIcon } from "@/components/icons";
import { TERMS } from "@/lib/copy";
import type { Author } from "@/lib/types";

export function AuthorLabel({ author }: { author: Author }) {
  if (author.username === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-text px-2 py-0.5 text-[0.6875rem] font-semibold text-bg">
        <MaskIcon className="size-3" />
        {TERMS.anonymous.label}
      </span>
    );
  }
  return (
    <Link href={`/u/${author.username}`} className="font-medium text-text hover:text-accent">
      {TERMS.user.prefix}
      {author.username}
    </Link>
  );
}
