import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { getPublicSupabaseKey, getPublicSupabaseUrl, isSupabaseConfigured } from "./config";

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createBrowserClient<Database>(getPublicSupabaseUrl(), getPublicSupabaseKey());
}
