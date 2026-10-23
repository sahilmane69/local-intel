function normalizePublicEnvironmentValue(value: string | undefined) {
  // Accept values copied as `NAME==value` once, without broadening which
  // variables can reach the browser client.
  return (value?.trim() || "").replace(/^=/, "");
}

export function getPublicSupabaseUrl() {
  return normalizePublicEnvironmentValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getPublicSupabaseKey() {
  return normalizePublicEnvironmentValue(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
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
