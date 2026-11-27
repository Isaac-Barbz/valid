"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { DEMO_MODE_MESSAGE, isSupabaseConfigured } from "@/lib/config";
import { TERMS } from "@/lib/copy";
import { normalizeTag, extractTags } from "@/lib/tags";
import { parseLayoutForSave } from "@/lib/profile-layout-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REPORT_REASONS, type ActionResult } from "@/lib/types";

const SIGN_IN_REQUIRED = "Sign in to do that.";

/** Extra communities a drop can also land in ("Also drop it in v/…"); matches the SQL trigger. */
const MAX_ALSO = 3;

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
  tags: z.string().max(400).default(""),
  also: z.array(z.string()).max(MAX_ALSO, `Pick up to ${MAX_ALSO} extra ${TERMS.community.many}.`),
  anonymous: checkbox,
});

export async function createPost(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = postSchema.safeParse({ ...Object.fromEntries(formData), also: formData.getAll("also") });
  if (!parsed.success) return firstIssue(parsed.error);
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const session = await signedInClient();
  if (!session) return { ok: false, error: SIGN_IN_REQUIRED, needsSignIn: true };
  const { supabase, userId } = session;
  const { community: slug, title, body, anonymous } = parsed.data;
  const also = parsed.data.also.filter((extra) => extra !== slug);

  const { data: communities } = await supabase.from("communities").select("id, slug").in("slug", [slug, ...also]);
  const community = communities?.find((row) => row.slug === slug);
  if (!community) return { ok: false, error: `That ${TERMS.community.one} doesn't exist.` };

  const id = crypto.randomUUID();
  const { error } = await supabase.from("posts").insert({
    id,
    community_id: community.id,
    author_id: userId,
    title,
    body,
    is_anonymous: anonymous,
  });
  if (error) return { ok: false, error: `Couldn't publish your ${TERMS.post.one}. Try again.` };

  // Tags and extra communities are best-effort: the drop itself is already up.
  const tags = extractTags(parsed.data.tags, title, body);
  if (tags.length) await supabase.from("post_tags").insert(tags.map((tag) => ({ post_id: id, tag })));
  const extras = (communities ?? []).filter((row) => row.slug !== slug);
  if (extras.length) {
    await supabase
      .from("community_listings")
      .insert(extras.map((row) => ({ community_id: row.id, post_id: id, status: "accepted", source: "author" })));
  }

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

/** Empty fields clear the column. */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `Keep ${label} under ${max} characters.`)
    .transform((value) => value || null);

const spaceSchema = z.object({
  layout: z.unknown(),
  bannerPath: z.string().max(200).nullable(),
  mood: optionalText(40, "your mood"),
  status: optionalText(140, "your status"),
  aboutMe: optionalText(2000, "“About me”"),
  wantToMeet: optionalText(1000, "“Who I'd like to meet”"),
  song: z
    .object({
      title: z.string().trim().min(1).max(80),
      artist: z.string().trim().max(80),
      url: z
        .string()
        .trim()
        .max(500)
        .refine((value) => value === "" || value.startsWith("https://"), "Song links must start with https://")
        .transform((value) => value || null),
    })
    .nullable(),
});

export type SpaceInput = z.input<typeof spaceSchema>;

const MEDIA_BUCKET = "profile-media";

/** Saves "Your space": layout JSON (validated, colors made readable) plus the profile text fields. */
export async function saveSpace(input: SpaceInput): Promise<ActionResult> {
  const parsed = spaceSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const layout = parseLayoutForSave(parsed.data.layout);
  if (!layout.ok) return { ok: false, error: layout.error };
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const session = await signedInClient();
  if (!session) return { ok: false, error: SIGN_IN_REQUIRED, needsSignIn: true };
  const { supabase, userId } = session;
  const { bannerPath, song, ...fields } = parsed.data;
  const paths = [bannerPath, layout.layout.backdrop.photoPath, ...layout.layout.photos];
  if (paths.some((path) => path !== null && !path.startsWith(`${userId}/`))) {
    return { ok: false, error: "Images must be uploaded from this page." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      layout: layout.layout,
      banner_path: bannerPath,
      mood: fields.mood,
      status: fields.status,
      about_me: fields.aboutMe,
      want_to_meet: fields.wantToMeet,
      song_title: song?.title ?? null,
      song_artist: song?.artist || null,
      song_url: song?.url ?? null,
    })
    .eq("id", userId);
  if (error) return { ok: false, error: "Couldn't save your space. Try again." };

  // Remove uploads that are no longer used anywhere on the page.
  const keep = new Set(paths);
  const { data: files } = await supabase.storage.from(MEDIA_BUCKET).list(userId);
  const unused = (files ?? []).map((file) => `${userId}/${file.name}`).filter((path) => !keep.has(path));
  if (unused.length) await supabase.storage.from(MEDIA_BUCKET).remove(unused);

  refresh();
  return { ok: true };
}

export type UploadResult = { ok: true; path: string; url: string } | { ok: false; error: string };

const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

const uploadSchema = z.object({
  kind: z.enum(["banner", "photo", "backdrop"]),
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0 && file.size <= IMAGE_MAX_BYTES, "Images must be under 2 MB.")
    .refine((file) => file.type.startsWith("image/"), "That isn't an image."),
});

/** Uploads one image (already resized to WebP in the browser) into the owner's folder. */
export async function uploadSpaceImage(formData: FormData): Promise<UploadResult> {
  const parsed = uploadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Couldn't use that image." };
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const session = await signedInClient();
  if (!session) return { ok: false, error: SIGN_IN_REQUIRED };
  const { supabase, userId } = session;

  const path = `${userId}/${parsed.data.kind}-${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, parsed.data.file, { contentType: parsed.data.file.type, cacheControl: "31536000" });
  if (error) return { ok: false, error: "Couldn't upload that image. Try a smaller one." };
  return { ok: true, path, url: supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl };
}

const homeSchema = z.object({ community: z.string() });

export async function setHomeCommunity(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = homeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const session = await signedInClient();
  if (!session) return { ok: false, error: SIGN_IN_REQUIRED, needsSignIn: true };
  const { supabase, userId } = session;

  let communityId: string | null = null;
  if (parsed.data.community) {
    const { data } = await supabase.from("communities").select("id").eq("slug", parsed.data.community).maybeSingle();
    if (!data) return { ok: false, error: `That ${TERMS.community.one} doesn't exist.` };
    communityId = data.id as string;
  }
  const { error } = await supabase.from("profiles").update({ home_community_id: communityId }).eq("id", userId);
  if (error) return { ok: false, error: "Couldn't save that. Try again." };
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
// Moderators: claimed tags and the Suggested queue
// ---------------------------------------------------------------------------

async function moderatedCommunity(slug: string) {
  const session = await signedInClient();
  if (!session) return null;
  const { data } = await session.supabase.from("communities").select("id").eq("slug", slug).maybeSingle();
  return data ? { ...session, communityId: data.id as string } : null;
}

const tagChangeSchema = z.object({
  community: z.string().min(1),
  tag: z.string().transform((value, ctx) => {
    const tag = normalizeTag(value);
    if (!tag) ctx.addIssue({ code: "custom", message: "Tags use letters, numbers, and _ (2–32 characters)." });
    return tag ?? "";
  }),
  action: z.enum(["claim", "release"]),
});

export async function changeClaimedTag(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = tagChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const context = await moderatedCommunity(parsed.data.community);
  if (!context) return { ok: false, error: SIGN_IN_REQUIRED, needsSignIn: true };
  const { supabase, userId, communityId } = context;
  const { tag, action } = parsed.data;

  const { error } =
    action === "claim"
      ? await supabase.from("community_tags").insert({ community_id: communityId, tag, added_by: userId })
      : await supabase.from("community_tags").delete().eq("community_id", communityId).eq("tag", tag);
  if (error) return { ok: false, error: "Only moderators can change claimed tags." };
  refresh();
  return { ok: true };
}

const decisionSchema = z.object({
  community: z.string().min(1),
  postId: z.string().min(1),
  decision: z.enum(["accepted", "dismissed"]),
});

export async function decideSuggestion(input: z.input<typeof decisionSchema>): Promise<ActionResult> {
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  if (!isSupabaseConfigured) return { ok: false, error: DEMO_MODE_MESSAGE };

  const context = await moderatedCommunity(parsed.data.community);
  if (!context) return { ok: false, error: SIGN_IN_REQUIRED, needsSignIn: true };
  const { supabase, userId, communityId } = context;

  const { postId, decision } = parsed.data;

  const { data: updated, error: updateError } = await supabase
    .from("community_listings")
    .update({ status: decision, decided_by: userId })
    .eq("community_id", communityId)
    .eq("post_id", postId)
    .select("post_id");
  const { error } =
    updateError || updated.length > 0
      ? { error: updateError }
      : await supabase.from("community_listings").insert({
          community_id: communityId,
          post_id: postId,
          status: decision,
          source: "moderator",
          decided_by: userId,
        });
  if (error) return { ok: false, error: "Only moderators can accept suggestions." };
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
