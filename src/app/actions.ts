"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { DEMO_MODE_MESSAGE, isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REPORT_REASONS, type ActionResult } from "@/lib/types";

const SIGN_IN_REQUIRED = "Sign in to do that.";

const checkbox = z.preprocess((value) => value === "on", z.boolean());

function firstIssue(error: z.ZodError): ActionResult {
  return { ok: false, error: error.issues[0]?.message ?? "Something looks off. Try again." };
}

async function signedInClient() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  return userId ? { supabase, userId } : null;
}

// ---------------------------------------------------------------------------
// Posts and comments
// ---------------------------------------------------------------------------

const postSchema = z.object({
  community: z.string().min(1, "Pick a community."),
  title: z.string().trim().min(1, "Add a title.").max(300, "Keep the title under 300 characters."),
  body: z.string().trim().max(40000, "That post is too long."),
  anonymous: checkbox,
});

export async function createPost(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const session = await signedInClient();
  if (!session) return { ok: false, error: SIGN_IN_REQUIRED, needsSignIn: true };
  const { supabase, userId } = session;

  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", parsed.data.community)
    .maybeSingle();
  if (!community) return { ok: false, error: "That community doesn't exist." };

  const id = crypto.randomUUID();
  const { error } = await supabase.from("posts").insert({
    id,
    community_id: community.id,
    author_id: userId,
    title: parsed.data.title,
    body: parsed.data.body,
    is_anonymous: parsed.data.anonymous,
  });
  if (error) return { ok: false, error: "Couldn't publish your post. Try again." };

  redirect(`/p/${id}`);
}

const commentSchema = z.object({
  postId: z.string().min(1),
  parentId: z.string().optional(),
  body: z.string().trim().min(1, "Write something first.").max(10000, "That comment is too long."),
  anonymous: checkbox,
});

export async function createComment(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const session = await signedInClient();
  if (!session) return { ok: false, error: SIGN_IN_REQUIRED, needsSignIn: true };

  const { error } = await session.supabase.from("comments").insert({
    id: crypto.randomUUID(),
    post_id: parsed.data.postId,
    parent_id: parsed.data.parentId || null,
    author_id: session.userId,
    body: parsed.data.body,
    is_anonymous: parsed.data.anonymous,
  });
  if (error) return { ok: false, error: "Couldn't post your comment. Try again." };

  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Votes and reports
// ---------------------------------------------------------------------------

const voteSchema = z.object({
  target: z.enum(["post", "comment"]),
  id: z.string().min(1),
  value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export async function castVote(input: z.input<typeof voteSchema>): Promise<ActionResult> {
  const parsed = voteSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const session = await signedInClient();
  if (!session) return { ok: false, error: SIGN_IN_REQUIRED, needsSignIn: true };

  const { target, id, value } = parsed.data;
  const table = target === "post" ? "post_votes" : "comment_votes";
  const idColumn = target === "post" ? "post_id" : "comment_id";

  const { error } =
    value === 0
      ? await session.supabase.from(table).delete().eq(idColumn, id).eq("user_id", session.userId)
      : await session.supabase
          .from(table)
          .upsert({ [idColumn]: id, user_id: session.userId, value }, { onConflict: `${idColumn},user_id` });
  if (error) return { ok: false, error: "Couldn't save your vote." };
  return { ok: true };
}

const reportSchema = z.object({
  target: z.enum(["post", "comment"]),
  id: z.string().min(1),
  reason: z.enum(REPORT_REASONS.map((r) => r.value), { message: "Pick a reason." }),
  details: z.string().trim().max(1000, "Keep details under 1000 characters.").default(""),
});

export async function submitReport(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const session = await signedInClient();
  if (!session) return { ok: false, error: SIGN_IN_REQUIRED, needsSignIn: true };

  const { target, id, reason, details } = parsed.data;
  const { error } = await session.supabase.from("reports").insert({
    reporter_id: session.userId,
    post_id: target === "post" ? id : null,
    comment_id: target === "comment" ? id : null,
    reason,
    details,
  });
  if (error) return { ok: false, error: "Couldn't send your report. Try again." };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function siteOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

const emailSchema = z.object({ email: z.email("Enter a valid email address.") });

export async function signInWithEmail(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error) return { ok: false, error: "Couldn't send the sign-in link. Try again in a minute." };
  return { ok: true };
}

export async function signInWithGoogle(): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error || !data.url) return { ok: false, error: "Google sign-in isn't available right now." };
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
