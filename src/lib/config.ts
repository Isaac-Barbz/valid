/**
 * Supabase settings. Both are public by design (the publishable key only
 * grants what Row Level Security allows). When either is missing the app runs
 * in demo mode on seed data and nothing is saved.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const DEMO_MODE_MESSAGE =
  "Demo mode: connect Supabase to save posts, comments, votes, and reports.";
