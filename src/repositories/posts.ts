import type { SupabaseClient } from "@supabase/supabase-js";

import {
  categories,
  unverifiedIntake,
  verificationStatuses,
  type Category,
  type EvidenceSource,
  type Issue,
  type IssueAttachment,
  type MediaKind,
  type PostComment,
  type Verification,
  type VerificationStatus,
} from "@/data/issues";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { isSafeExternalUrl, validateMediaFile, validateReportFields } from "@/lib/post-validation";
import type { Database, Json } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type FeedSource = "supabase";
export type FeedResult = { posts: Issue[]; source: FeedSource; error?: string };
export type CreatePostInput = Pick<Issue, "title" | "description" | "category" | "city" | "neighborhood" | "address" | "tags" | "evidence" | "coordinates" | "locationSource" | "attachments" | "verification">;

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "LI";
}

function asCategory(value: string): Category {
  return categories.includes(value as Category) ? (value as Category) : "roads";
}

function asVerificationStatus(value: string): VerificationStatus {
  return verificationStatuses.includes(value as VerificationStatus) ? (value as VerificationStatus) : "unverified";
}

type FeedRow = {
  id: string; author_id: string; title: string; body: string; category: string; status: Issue["status"]; city: string | null; neighborhood: string; address: string | null;
  latitude: number | null; longitude: number | null; location_source: "gps" | "manual" | null; verification_status: string;
  upvote_count: number; comment_count: number; tags: string[] | null; intake_notes: string | null; created_at: string;
  author: { display_name: string; avatar_url: string | null } | null;
  post_media: Array<{ id: string; kind: MediaKind; public_url: string; mime_type: string; file_name: string; caption: string | null; poster_url: string | null; sort_order: number }> | null;
  comments: Array<{ id: string; post_id: string; parent_id: string | null; body: string; created_at: string; author: { display_name: string } | null }> | null;
  evidence_sources: Array<{ id: string; kind: EvidenceSource["kind"]; label: string; href: string | null; note: string | null; recorded_at: string | null; media_id: string | null }> | null;
  verification_events: Array<{ status: string; notes: string; created_at: string; actor: { display_name: string } | null }> | null;
  ai_analyses: Array<{ summary: string; suggested_category: string | null; duplicate_hints: Json; evidence_notes: string; sources: Json; checked_at: string; model: string; created_at: string }> | null;
};

const feedSelect = `
  id, author_id, title, body, category, status, city, neighborhood, address, latitude, longitude,
  location_source, verification_status, upvote_count, comment_count, tags, intake_notes, created_at,
  author:profiles!posts_author_id_fkey(display_name, avatar_url),
  post_media(id, kind, public_url, mime_type, file_name, caption, poster_url, sort_order),
  comments(id, post_id, parent_id, body, created_at, author:profiles!comments_author_id_fkey(display_name)),
  evidence_sources(id, kind, label, href, note, recorded_at, media_id),
  verification_events(status, notes, created_at, actor:profiles!verification_events_actor_id_fkey(display_name)),
  ai_analyses(summary, suggested_category, duplicate_hints, evidence_notes, sources, checked_at, model, created_at)
`;

function mapFeedRow(row: FeedRow): Issue {
  const attachments = [...(row.post_media ?? [])].sort((a, b) => a.sort_order - b.sort_order).map<IssueAttachment>((media) => ({
    id: media.id, kind: media.kind, name: media.file_name, mimeType: media.mime_type, url: media.public_url,
    caption: media.caption ?? undefined, poster: media.poster_url ?? undefined,
  }));
  const sources = (row.evidence_sources ?? []).map<EvidenceSource>((source) => ({
    id: source.id, kind: source.kind, label: source.label, href: source.href ?? undefined, note: source.note ?? undefined,
    recordedAt: source.recorded_at ?? undefined, attachmentId: source.media_id ?? undefined,
  }));
  const latestVerification = [...(row.verification_events ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const verification: Verification = latestVerification ? {
    status: asVerificationStatus(latestVerification.status), notes: latestVerification.notes, assessedAt: latestVerification.created_at,
    assessedBy: latestVerification.actor?.display_name ?? "Local Intel staff", sources,
  } : {
    ...unverifiedIntake(row.created_at, sources), status: asVerificationStatus(row.verification_status),
    notes: row.intake_notes ?? "Neighbor-submitted. This report has not been independently confirmed by city staff or a trusted publisher.",
  };
  const latestAnalysis = [...(row.ai_analyses ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const duplicateHints = Array.isArray(latestAnalysis?.duplicate_hints) ? latestAnalysis.duplicate_hints.filter((item): item is string => typeof item === "string") : [];

  return {
    id: row.id, authorId: row.author_id, title: row.title, description: row.body, category: asCategory(row.category), status: row.status, city: row.city,
    neighborhood: row.neighborhood as Issue["neighborhood"], address: row.address ?? "Location not specified", upvotes: row.upvote_count,
    commentCount: row.comment_count, reporter: { name: row.author?.display_name ?? "Local neighbor", initials: initials(row.author?.display_name ?? "Local neighbor") },
    createdAt: row.created_at, tags: row.tags ?? [], evidence: row.intake_notes ?? undefined,
    coordinates: row.latitude === null || row.longitude === null ? null : { lat: Number(row.latitude), lng: Number(row.longitude) },
    locationSource: row.location_source ?? undefined, attachments, verification,
    comments: (row.comments ?? []).map<PostComment>((comment) => ({
      id: comment.id, postId: comment.post_id, parentId: comment.parent_id, body: comment.body, createdAt: comment.created_at,
      author: { name: comment.author?.display_name ?? "Local neighbor", initials: initials(comment.author?.display_name ?? "Local neighbor") },
    })),
    aiInsight: latestAnalysis ? { summary: latestAnalysis.summary, suggestedCategory: latestAnalysis.suggested_category ? asCategory(latestAnalysis.suggested_category) : null, duplicateHints, evidenceNotes: latestAnalysis.evidence_notes, generatedAt: latestAnalysis.created_at, checkedAt: latestAnalysis.checked_at, model: latestAnalysis.model, sources: Array.isArray(latestAnalysis.sources) ? latestAnalysis.sources.filter((source): source is { title: string; url: string; publishedAt?: string | null } => typeof source === "object" && source !== null && typeof (source as { title?: unknown }).title === "string" && typeof (source as { url?: unknown }).url === "string") : [] } : null,
  };
}

export async function listPostsWith(client: Client): Promise<FeedResult> {
  const { data, error } = await client
    .from("posts")
    .select(feedSelect)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return { posts: [], source: "supabase", error: error.message };
  return { posts: (data as unknown as FeedRow[]).map(mapFeedRow), source: "supabase" };
}

export async function refreshPosts(): Promise<FeedResult> {
  const client = createBrowserSupabaseClient();
  if (!client) return { posts: [], source: "supabase", error: "Supabase environment variables are invalid." };
  return listPostsWith(client);
}

async function requireUser(client: Client) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Please sign in to continue.");
  return data.user;
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "upload";
}

export async function createPost(input: CreatePostInput): Promise<Issue> {
  const validationError = validateReportFields({ ...input, tags: input.tags ?? [] });
  if (validationError) throw new Error(validationError);
  for (const attachment of input.attachments ?? []) {
    if (!attachment.file) throw new Error(`The file for ${attachment.name} is no longer available. Choose it again.`);
    const mediaError = validateMediaFile(attachment.file);
    if (mediaError) throw new Error(mediaError);
  }
  for (const source of input.verification.sources) {
    if (source.href && !isSafeExternalUrl(source.href)) throw new Error("Evidence links must use http or https.");
  }
  const client = createBrowserSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const user = await requireUser(client);
  const { data: post, error: postError } = await client.from("posts").insert({
    author_id: user.id, title: input.title.trim(), body: input.description.trim(), category: input.category,
    city: input.city?.trim() || null, neighborhood: input.neighborhood, address: input.address.trim() || null, latitude: input.coordinates?.lat ?? null,
    longitude: input.coordinates?.lng ?? null, location_source: input.coordinates ? input.locationSource ?? "manual" : null,
    tags: input.tags ?? [], intake_notes: input.evidence?.trim() || null,
  }).select("id").single();
  if (postError || !post) throw new Error(postError?.message ?? "Could not create the report.");

  const uploadedPaths: string[] = [];
  try {
    const mediaRows: Database["public"]["Tables"]["post_media"]["Insert"][] = [];
    const mediaIdByDraftId = new Map<string, string>();
    for (const [index, attachment] of (input.attachments ?? []).entries()) {
      const file = attachment.file;
      if (!file) throw new Error(`The file for ${attachment.name} is no longer available. Choose it again.`);
      const path = `${user.id}/${post.id}/${crypto.randomUUID()}-${safeFileName(attachment.name)}`;
      const { error: uploadError } = await client.storage.from("post-media").upload(path, file, { contentType: attachment.mimeType, upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      uploadedPaths.push(path);
      const { data: publicUrl } = client.storage.from("post-media").getPublicUrl(path);
      mediaRows.push({ post_id: post.id, kind: attachment.kind, storage_path: path, public_url: publicUrl.publicUrl, mime_type: attachment.mimeType, file_name: attachment.name, caption: attachment.caption ?? null, poster_url: attachment.poster ?? null, sort_order: index });
    }
    if (mediaRows.length) {
      const { data: insertedMedia, error: mediaError } = await client.from("post_media").insert(mediaRows).select("id, file_name");
      if (mediaError) throw new Error(mediaError.message);
      for (const attachment of input.attachments ?? []) {
        const inserted = insertedMedia?.find((media) => media.file_name === attachment.name);
        if (inserted) mediaIdByDraftId.set(attachment.id, inserted.id);
      }
    }
    const sources = input.verification.sources.map((source) => ({
      post_id: post.id, media_id: source.attachmentId ? mediaIdByDraftId.get(source.attachmentId) ?? null : null,
      kind: source.kind, label: source.label, href: source.href ?? null, note: source.note ?? null, recorded_at: source.recordedAt ?? null,
    }));
    if (sources.length) {
      const { error: sourcesError } = await client.from("evidence_sources").insert(sources);
      if (sourcesError) throw new Error(sourcesError.message);
    }
  } catch (error) {
    if (uploadedPaths.length) await client.storage.from("post-media").remove(uploadedPaths);
    await client.from("posts").delete().eq("id", post.id);
    throw error;
  }
  const feed = await refreshPosts();
  const created = feed.posts.find((item) => item.id === post.id);
  if (!created) throw new Error(feed.error ?? "Report was created, but could not be reloaded.");
  return created;
}

export async function addComment(postId: string, body: string, parentId: string | null) {
  const client = createBrowserSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const user = await requireUser(client);
  const text = body.trim();
  if (!text) throw new Error("A comment cannot be empty.");
  const { error } = await client.from("comments").insert({ post_id: postId, author_id: user.id, parent_id: parentId, body: text });
  if (error) throw new Error(error.message);
}

export async function toggleVote(postId: string) {
  const client = createBrowserSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const user = await requireUser(client);
  const { data: existing, error: lookupError } = await client.from("post_votes").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
  if (lookupError) throw new Error(lookupError.message);
  const { error } = existing ? await client.from("post_votes").delete().eq("id", existing.id) : await client.from("post_votes").insert({ post_id: postId, user_id: user.id, value: 1 });
  if (error) throw new Error(error.message);
}

export async function listSavedPostIds() {
  const client = createBrowserSupabaseClient();
  if (!client) return [];
  const { data } = await client.from("saved_posts").select("post_id");
  return data?.map((item) => item.post_id) ?? [];
}

export async function toggleSavedPost(postId: string) {
  const client = createBrowserSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const user = await requireUser(client);
  const { data: existing, error: lookupError } = await client.from("saved_posts").select("id").eq("post_id", postId).maybeSingle();
  if (lookupError) throw new Error(lookupError.message);
  const { error } = existing ? await client.from("saved_posts").delete().eq("id", existing.id) : await client.from("saved_posts").insert({ post_id: postId, user_id: user.id });
  if (error) throw new Error(error.message);
}
