import Link from "next/link";

import { TERMS } from "@/lib/copy";

/** A #tag linking to its page. */
export function TagChip({ tag, count }: { tag: string; count?: number }) {
  return (
    <Link
      href={`/t/${tag}`}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-sm font-semibold whitespace-nowrap text-text transition-colors hover:border-accent hover:text-accent"
    >
      {TERMS.tag.prefix}
      {tag}
      {count !== undefined && <span className="text-xs font-normal text-text-muted">{count}</span>}
    </Link>
  );
}
