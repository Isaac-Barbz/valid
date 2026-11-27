"use client";

import { useState } from "react";

import { ChevronDownIcon, ChevronUpIcon, GripIcon } from "@/components/icons";
import { capitalize, TERMS } from "@/lib/copy";
import type { BlockType, LayoutBlock } from "@/lib/profile-layout";

const BLOCK_LABELS: Record<BlockType, string> = {
  about: TERMS.profile.aboutMe,
  top8: TERMS.profile.topFriends,
  song: TERMS.profile.song,
  nowPlaying: "Now playing",
  pinned: TERMS.profile.pinned,
  photos: TERMS.profile.photos,
  links: TERMS.profile.links,
  wall: TERMS.profile.wall,
  drops: capitalize(TERMS.post.many),
};

function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const iconButton =
  "flex size-9 items-center justify-center rounded-control text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-30";

/** Show/hide and reorder blocks: drag on desktop, arrow buttons everywhere. */
export function BlocksTab({ blocks, onChange }: { blocks: LayoutBlock[]; onChange: (blocks: LayoutBlock[]) => void }) {
  const [dragging, setDragging] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-text-muted">Turn blocks on or off and put them in any order.</p>
      <ol className="flex flex-col gap-1.5">
        {blocks.map((block, index) => {
          const label = BLOCK_LABELS[block.type];
          return (
            <li
              key={block.type}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                setDragging(index);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (dragging === null || dragging === index) return;
                onChange(move(blocks, dragging, index));
                setDragging(index);
              }}
              onDragEnd={() => setDragging(null)}
              className={`flex items-center gap-2 rounded-control border bg-surface py-1 pr-1 pl-2 ${
                dragging === index ? "border-accent" : "border-border"
              }`}
            >
              <GripIcon className="size-4 shrink-0 cursor-grab text-text-muted max-md:hidden" />
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-1.5 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={block.visible}
                  onChange={(event) =>
                    onChange(blocks.map((b, i) => (i === index ? { ...b, visible: event.target.checked } : b)))
                  }
                  className="size-4 accent-(--accent)"
                />
                <span className={block.visible ? "" : "text-text-muted"}>{label}</span>
              </label>
              <button
                type="button"
                className={iconButton}
                disabled={index === 0}
                onClick={() => onChange(move(blocks, index, index - 1))}
                aria-label={`Move ${label} up`}
              >
                <ChevronUpIcon className="size-4" />
              </button>
              <button
                type="button"
                className={iconButton}
                disabled={index === blocks.length - 1}
                onClick={() => onChange(move(blocks, index, index + 1))}
                aria-label={`Move ${label} down`}
              >
                <ChevronDownIcon className="size-4" />
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
