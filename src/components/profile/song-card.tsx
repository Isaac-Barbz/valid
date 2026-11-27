"use client";

import { useRef, useState } from "react";

import { MusicIcon, PauseIcon, PlayIcon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { TERMS } from "@/lib/copy";
import type { ProfileSong } from "@/lib/types";

/** The profile song. Never autoplays; audio loads only when someone presses play. */
export function SongCard({ song }: { song: ProfileSong }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }

  return (
    <Card className="flex items-center gap-4 p-4">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-control bg-accent text-on-accent">
        <MusicIcon className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.6875rem] font-bold tracking-wide text-accent uppercase">{TERMS.profile.song}</p>
        <p className="truncate font-semibold">{song.title}</p>
        <p className="truncate text-sm text-text-muted">{song.artist}</p>
      </div>
      {song.url && (
        <>
          <audio
            ref={audioRef}
            src={song.url}
            preload="none"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? `Pause ${song.title}` : `Play ${song.title}`}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {playing ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5" />}
          </button>
        </>
      )}
    </Card>
  );
}
