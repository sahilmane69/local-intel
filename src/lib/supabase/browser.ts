import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseKey, getPublicSupabaseUrl, isSupabaseConfigured } from "./config";

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createBrowserClient(getPublicSupabaseUrl(), getPublicSupabaseKey());
}
