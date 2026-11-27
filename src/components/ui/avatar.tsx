import Image from "next/image";

import { accentColor, avatarAccent, onAccentColor } from "@/lib/profile-theme";
import type { PersonSummary } from "@/lib/types";

const SIZES = {
  sm: "size-8 text-sm",
  md: "size-10 text-base",
  lg: "size-14 text-xl",
  xl: "size-28 text-5xl sm:size-32",
  fill: "aspect-square w-full text-2xl",
} as const;

interface AvatarProps {
  person: PersonSummary;
  size?: keyof typeof SIZES;
  /** Rounded square (Top 8 tiles) instead of a circle. */
  square?: boolean;
  /** Use the surrounding accent color (e.g. the owner's color on their own page). */
  themed?: boolean;
  className?: string;
}

/** Profile photo, or the person's initial on a solid color picked from their username. */
export function Avatar({ person, size = "md", square = false, themed = false, className = "" }: AvatarProps) {
  const shape = square ? "rounded-control" : "rounded-full";
  const name = person.displayName ?? person.username;

  if (person.avatarUrl) {
    return (
      <span className={`relative block shrink-0 overflow-hidden ${shape} ${SIZES[size]} ${className}`}>
        {/* User uploads skip Vercel image optimization (free-tier quota). */}
        <Image src={person.avatarUrl} alt="" fill unoptimized className="object-cover" />
      </span>
    );
  }

  const accent = avatarAccent(person.username);
  const colors = themed
    ? "bg-accent text-on-accent"
    : "bg-(--avatar-color) text-(--avatar-on-color)";
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center font-display font-bold ${colors} ${shape} ${SIZES[size]} ${className}`}
      style={{ "--avatar-color": accentColor(accent), "--avatar-on-color": onAccentColor(accent) }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
