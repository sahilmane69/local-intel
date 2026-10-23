import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { listPostsWith, type FeedResult } from "./posts";

function message(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function listPosts(): Promise<FeedResult> {
  if (!isSupabaseConfigured()) return { posts: [], source: "supabase", error: "Supabase public environment variables are missing or invalid." };
  try {
    const client = await createServerSupabaseClient();
    if (!client) return { posts: [], source: "supabase", error: "Supabase client could not be created." };
    return listPostsWith(client);
  } catch (error) {
    return { posts: [], source: "supabase", error: message(error, "Could not load community posts.") };
  }
}
