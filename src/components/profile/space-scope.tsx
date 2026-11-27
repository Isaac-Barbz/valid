import type { ReactNode } from "react";

import { spaceStyle, type ProfileLayout } from "@/lib/profile-layout";

/**
 * Re-points the design tokens at the owner's colors, font, card style, and
 * backdrop for everything inside their space (and the editor's preview).
 */
export function SpaceScope({
  layout,
  backdropUrl,
  className = "",
  children,
}: {
  layout: ProfileLayout;
  backdropUrl: string | null;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div style={spaceStyle(layout, backdropUrl)} className={`flex flex-col bg-bg font-profile text-text ${className}`}>
      {children}
    </div>
  );
}
