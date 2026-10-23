export function getPublicSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
}

export function getPublicSupabaseKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "";
}

export function isSupabaseConfigured() {
  return getPublicSupabaseUrl().length > 0 && getPublicSupabaseKey().length > 0;
}
