import { MaskIcon } from "@/components/icons";
import type { Author } from "@/lib/types";

export function AuthorLabel({ author }: { author: Author }) {
  if (author.username === null) {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-text">
        <MaskIcon className="size-3.5" />
        Anonymous
      </span>
    );
  }
  return <span className="font-medium text-text">u/{author.username}</span>;
}
