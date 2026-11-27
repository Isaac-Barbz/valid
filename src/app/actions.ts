"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { DEMO_MODE_MESSAGE, isSupabaseConfigured } from "@/lib/config";
import { TERMS } from "@/lib/copy";
import { ACCENTS, BACKGROUNDS, FONTS } from "@/lib/profile-theme";
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
  community: z.string().min(1, `Pick a ${TERMS.community.one}.`),
  title: z.string().trim().min(1, "Add a title.").max(300, "Keep the title under 300 characters."),
  body: z.string().trim().max(40000, `That ${TERMS.post.one} is too long.`),
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
  if (!community) return { ok: false, error: `That ${TERMS.community.one} doesn't exist.` };

  const id = crypto.randomUUID();
  const { error } = await supabase.from("posts").insert({
    id,
    community_id: community.id,
    author_id: userId,
    title: parsed.data.title,
    body: parsed.data.body,
    is_anonymous: parsed.data.anonymous,
  });
  if (error) return { ok: false, error: `Couldn't publish your ${TERMS.post.one}. Try again.` };

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
// Profiles, friends, and walls
// ---------------------------------------------------------------------------

/** Empty form fields clear the column. */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `Keep ${label} under ${max} characters.`)
    .transform((value) => value || null);

const BANNER_MAX_BYTES = 2 * 1024 * 1024;

const profileSchema = z.object({
  accent: z.enum(ACCENTS),
  background: z.enum(BACKGROUNDS),
  font: z.enum(FONTS),
  mood: optionalText(40, "your mood"),
  status: optionalText(140, "your status"),
  aboutMe: optionalText(2000, "“About me”"),
  wantToMeet: optionalText(1000, "“Who I'd like to meet”"),
  songTitle: optionalText(80, "the song title"),
  songArtist: optionalText(80, "the artist"),
  songUrl: z
    .string()
    .trim()
    .max(500, "That song link is too long.")
    .refine((value) => value === "" || value.startsWith("https://"), "Song links must start with https://")
    .transform((value) => value || null),
  banner: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= BANNER_MAX_BYTES, "Banner images must be under 2 MB.")
    .refine(
      (file) => !file || file.size === 0 || file.type.startsWith("image/"),
      "Banners must be an image.",
    ),
  removeBanner: checkbox,
});

export async function updateProfile(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const session = await signedInClient();
  if (!session) return { ok: false, error: SIGN_IN_REQUIRED, needsSignIn: true };
  const { supabase, userId } = session;
  const { banner, removeBanner, ...fields } = parsed.data;

  const { data: current } = await supabase.from("profiles").select("banner_path").eq("id", userId).single();
  const oldBanner = (current?.banner_path as string | null | undefined) ?? null;
  let bannerPath = removeBanner ? null : oldBanner;

  if (banner && banner.size > 0) {
    bannerPath = `${userId}/banner-${Date.now()}.webp`;
    const { error } = await supabase.storage
      .from("profile-media")
      .upload(bannerPath, banner, { contentType: banner.type, cacheControl: "31536000" });
    if (error) return { ok: false, error: "Couldn't upload your banner. Try a smaller image." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      accent: fields.accent,
      background: fields.background,
      font: fields.font,
      mood: fields.mood,
      status: fields.status,
      about_me: fields.aboutMe,
      want_to_meet: fields.wantToMeet,
      song_title: fields.songTitle,
      song_artist: fields.songArtist,
      song_url: fields.songTitle ? fields.songUrl : null,
      banner_path: bannerPath,
    })
    .eq("id", userId);
  if (error) return { ok: false, error: "Couldn't save your page. Try again." };

  if (oldBanner && oldBanner !== bannerPath) {
    await supabase.storage.from("profile-media").remove([oldBanner]);
  }

  refresh();
  return { ok: true };
}

const friendSchema = z.object({
  username: z.string().min(1),
  action: z.enum(["request", "accept", "remove"]),
});

export async function changeFriendship(input: z.input<typeof friendSchema>): Promise<ActionResult> {
  const parsed = friendSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const session = await signedInClient();
  if (!session) return { ok: false, error: SIGN_IN_REQUIRED, needsSignIn: true };
  const { supabase, userId } = session;

  const { data: other } = await supabase.from("profiles").select("id").eq("username", parsed.data.username).maybeSingle();
  if (!other || other.id === userId) return { ok: false, error: "That person doesn't exist." };
  const otherId = other.id as string;

  const { error } =
    parsed.data.action === "request"
      ? await supabase.from("friendships").insert({ requester_id: userId, addressee_id: otherId })
      : parsed.data.action === "accept"
        ? await supabase
            .from("friendships")
            .update({ status: "accepted" })
            .eq("requester_id", otherId)
            .eq("addressee_id", userId)
        : await supabase
            .from("friendships")
            .delete()
            .or(
              `and(requester_id.eq.${userId},addressee_id.eq.${otherId}),` +
                `and(requester_id.eq.${otherId},addressee_id.eq.${userId})`,
            );
  if (error) return { ok: false, error: "Couldn't update that friendship. Try again." };

  refresh();
  return { ok: true };
}

const wallSchema = z.object({
  username: z.string().min(1),
  body: z.string().trim().min(1, "Write something first.").max(1000, "Keep it under 1000 characters."),
});

export async function addWallComment(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = wallSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const session = await signedInClient();
  if (!session) return { ok: false, error: SIGN_IN_REQUIRED, needsSignIn: true };
  const { supabase, userId } = session;

  const { data: profile } = await supabase.from("profiles").select("id").eq("username", parsed.data.username).maybeSingle();
  if (!profile) return { ok: false, error: "That person doesn't exist." };

  const { error } = await supabase
    .from("profile_comments")
    .insert({ profile_id: profile.id, author_id: userId, body: parsed.data.body });
  if (error) return { ok: false, error: `Only ${TERMS.friend.many} can write on this ${TERMS.profile.wall.toLowerCase()}.` };

  refresh();
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
