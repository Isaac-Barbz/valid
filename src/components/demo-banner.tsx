import { DEMO_MODE_MESSAGE, isSupabaseConfigured } from "@/lib/config";

export function DemoBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <p className="bg-warning-soft px-4 py-2 text-center text-xs font-medium text-on-warning-soft">
      {DEMO_MODE_MESSAGE}
    </p>
  );
}
