import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseUrl } from "./config";

/**
 * Server-only client. Never import this module from a Client Component.
 * The secret key must stay off the browser bundle.
 */
export function createAdminSupabaseClient() {
  const url = getPublicSupabaseUrl() || process.env.SUPABASE_URL?.trim() || "";
  const secret = process.env.SUPABASE_SECRET_KEY?.trim() || "";

  if (!url || !secret) {
    return null;
  }

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
