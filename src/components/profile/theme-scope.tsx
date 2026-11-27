"use client";

import { createContext, use, useState, type ReactNode } from "react";

import { themeStyle, type ProfileTheme } from "@/lib/profile-theme";

interface ProfileLook {
  theme: ProfileTheme;
  bannerUrl: string | null;
}

interface ProfileLookContext extends ProfileLook {
  preview: (look: Partial<ProfileLook>) => void;
}

const LookContext = createContext<ProfileLookContext | null>(null);

export function useProfileLook(): ProfileLookContext {
  const context = use(LookContext);
  if (!context) throw new Error("useProfileLook must be used inside <ProfileThemeScope>");
  return context;
}

/**
 * Applies the owner's colors and font to everything inside a profile page and
 * lets the customize panel preview changes live before saving.
 */
export function ProfileThemeScope({ initial, children }: { initial: ProfileLook; children: ReactNode }) {
  const [look, setLook] = useState(initial);
  const preview = (next: Partial<ProfileLook>) => setLook((current) => ({ ...current, ...next }));

  return (
    <LookContext value={{ ...look, preview }}>
      <div style={themeStyle(look.theme)} className="flex flex-1 flex-col bg-bg font-profile">
        {children}
      </div>
    </LookContext>
  );
}
