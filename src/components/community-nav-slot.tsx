import { CommunityNav, CommunityNavSkeleton } from "@/components/community-nav";
import { isSupabaseConfigured } from "@/lib/config";
import { getViewer, getViewerProfile, listCommunities, listNavCommunities } from "@/lib/data";

/** Loads shortcut communities and the account hide preference for the feed row. */
export async function CommunityNavSlot() {
  const [communities, catalog, viewer, profile] = await Promise.all([
    listNavCommunities(),
    listCommunities(),
    getViewer(),
    getViewerProfile(),
  ]);
  // Signed-in on a real project: the profile column is source of truth.
  // Demo and signed-out: the client reads localStorage (showRow is null).
  const showRow = isSupabaseConfigured && viewer ? (profile?.showCommunityRow ?? true) : null;
  return <CommunityNav communities={communities} catalog={catalog} showRow={showRow} />;
}

export { CommunityNavSkeleton };
