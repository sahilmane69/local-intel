import assert from "node:assert/strict";
import test from "node:test";

import { isSafeExternalUrl, MAX_MEDIA_BYTES, validateMediaFile, validateReportFields } from "../src/lib/post-validation.ts";

test("accepts only http(s) evidence links", () => {
  assert.equal(isSafeExternalUrl("https://city.example/notice"), true);
  assert.equal(isSafeExternalUrl("http://city.example/notice"), true);
  assert.equal(isSafeExternalUrl("https://user:password@city.example/notice"), false);
  assert.equal(isSafeExternalUrl("javascript:alert(1)"), false);
  assert.equal(isSafeExternalUrl("not a url"), false);
});

test("validates report field limits before a database request", () => {
  assert.equal(validateReportFields({ title: "Road closure", description: "Work is underway.", city: "Springfield", neighborhood: "Center", address: "1 Main St", tags: ["roadwork"] }), null);
  assert.match(validateReportFields({ title: "x".repeat(161), description: "", city: "City", neighborhood: "Center", address: "", tags: [] }) ?? "", /160/);
  assert.match(validateReportFields({ title: "A report", description: "A description", city: "City", neighborhood: "", address: "", tags: [] }) ?? "", /neighborhood/);
  assert.match(validateReportFields({ title: "", description: "A report", city: "City", neighborhood: "Center", address: "", tags: [] }) ?? "", /title/);
  assert.match(validateReportFields({ title: "A report", description: "", city: "City", neighborhood: "Center", address: "", tags: [] }) ?? "", /description/);
});

test("rejects unsupported and oversized media before upload", () => {
  assert.equal(validateMediaFile({ name: "photo.jpg", type: "image/jpeg", size: 1 }), null);
  assert.match(validateMediaFile({ name: "payload.svg", type: "image/svg+xml", size: 1 }) ?? "", /supported/);
  assert.match(validateMediaFile({ name: "large.jpg", type: "image/jpeg", size: MAX_MEDIA_BYTES + 1 }) ?? "", /50 MB/);
});
