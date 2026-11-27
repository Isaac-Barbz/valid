import type { ProfileLayout } from "@/lib/profile-layout";

/** Everything the editor can change, saved together by `saveSpace`. */
export interface SpaceDraft {
  layout: ProfileLayout;
  bannerPath: string | null;
  mood: string;
  status: string;
  aboutMe: string;
  wantToMeet: string;
  song: { title: string; artist: string; url: string };
}

export type UpdateDraft = (change: (draft: SpaceDraft) => SpaceDraft) => void;
export type UpdateLayout = (change: Partial<ProfileLayout>) => void;
