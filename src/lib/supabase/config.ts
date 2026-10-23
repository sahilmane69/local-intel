export function getPublicSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
}

export function getPublicSupabaseKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "";
}

export function hasSupabaseCredentials() {
  return getPublicSupabaseUrl().length > 0 && getPublicSupabaseKey().length > 0;
}

export function isSupabaseConfigured() {
  if (!hasSupabaseCredentials()) return false;

  try {
    const url = new URL(getPublicSupabaseUrl());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
