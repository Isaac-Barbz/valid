import Link from "next/link";

import { SORT_MODES, type SortMode } from "@/lib/types";

const LABELS: Record<SortMode, string> = { hot: "Hot", new: "New", top: "Top" };

export function SortTabs({ basePath, active }: { basePath: string; active: SortMode }) {
  return (
    <nav aria-label="Sort posts" className="flex gap-1 rounded-control bg-surface-muted p-1">
      {SORT_MODES.map((mode) => (
        <Link
          key={mode}
          href={mode === "hot" ? basePath : `${basePath}?sort=${mode}`}
          aria-current={mode === active ? "page" : undefined}
          className={`flex-1 rounded-control px-4 py-1.5 text-center text-sm font-medium transition-colors sm:flex-none ${
            mode === active ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"
          }`}
        >
          {LABELS[mode]}
        </Link>
      ))}
    </nav>
  );
}
