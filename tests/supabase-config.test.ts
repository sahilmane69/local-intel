import assert from "node:assert/strict";
import test from "node:test";

import { getPublicSupabaseKey, getPublicSupabaseUrl, isSupabaseConfigured } from "../src/lib/supabase/config.ts";

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] as const;

test.afterEach(() => {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
});

test("reports unconfigured Supabase when public credentials are missing", () => {
  assert.equal(isSupabaseConfigured(), false);
  assert.equal(getPublicSupabaseUrl(), "");
  assert.equal(getPublicSupabaseKey(), "");
});

test("accepts a configured Supabase project with an https url and publishable key", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  assert.equal(isSupabaseConfigured(), true);
  assert.equal(getPublicSupabaseUrl(), "https://example.supabase.co");
  assert.equal(getPublicSupabaseKey(), "sb_publishable_test");
});

test("rejects non-https Supabase urls and ignores a single leading equals in keys", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "ftp://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "==sb_publishable_test";
  assert.equal(isSupabaseConfigured(), false);
  assert.equal(getPublicSupabaseKey(), "sb_publishable_test");
});
