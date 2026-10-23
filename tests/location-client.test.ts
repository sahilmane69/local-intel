import assert from "node:assert/strict";
import test from "node:test";

import { reverseGeocode } from "../src/lib/location-client.ts";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

test("reverse geocoding returns the resolved address fields", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    jsonResponse({
      display_name: "123 Main St, Springfield",
      address: { city: "Springfield", neighbourhood: "Downtown" },
    })) as typeof fetch;

  try {
    const result = await reverseGeocode(40.7, -74.0);
    assert.equal(result.address, "123 Main St, Springfield");
    assert.equal(result.city, "Springfield");
    assert.equal(result.neighborhood, "Downtown");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("reverse geocoding tolerates missing optional fields", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => jsonResponse({ display_name: "Somewhere" })) as typeof fetch;

  try {
    const result = await reverseGeocode(1.0, 2.0);
    assert.equal(result.address, "Somewhere");
    assert.equal(result.city, null);
    assert.equal(result.neighborhood, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("reverse geocoding rejects failed upstream responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => jsonResponse({}, 502)) as typeof fetch;

  try {
    await assert.rejects(() => reverseGeocode(1.0, 2.0), /Reverse geocoding failed/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
