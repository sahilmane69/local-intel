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

test("rejects evidence schemes and urls without a usable host", () => {
  assert.equal(isSafeExternalUrl("data:text/html,<script>alert(1)</script>"), false);
  assert.equal(isSafeExternalUrl("ftp://city.example/notice"), false);
  assert.equal(isSafeExternalUrl("https://"), false);
  assert.equal(isSafeExternalUrl(""), false);
});

test("validates report field limits before a database request", () => {
  assert.equal(validateReportFields({ title: "Road closure", description: "Work is underway.", city: "Springfield", neighborhood: "Center", address: "1 Main St", tags: ["roadwork"] }), null);
  assert.match(validateReportFields({ title: "x".repeat(161), description: "Work is underway.", city: "Springfield", neighborhood: "Center", address: "1 Main St", tags: [] }) ?? "", /160/);
  assert.match(validateReportFields({ title: "A report", description: "A description", city: "City", neighborhood: "Center", address: "", tags: [] }) ?? "", /description/);
  assert.match(validateReportFields({ title: "A report", description: "x".repeat(4_001), city: "City", neighborhood: "Center", address: "", tags: [] }) ?? "", /4,000/);
  assert.match(validateReportFields({ title: "A report", description: "A description", city: "x".repeat(121), neighborhood: "Center", address: "", tags: [] }) ?? "", /Cities must be 120/);
  assert.match(validateReportFields({ title: "A report", description: "A description", city: "City", neighborhood: "", address: "", tags: [] }) ?? "", /neighborhood/);
  assert.match(validateReportFields({ title: "A report", description: "A description", city: "City", neighborhood: "x".repeat(121), address: "", tags: [] }) ?? "", /neighborhood/);
  assert.match(validateReportFields({ title: "A report", description: "A description", city: "City", neighborhood: "Center", address: "x".repeat(501), tags: [] }) ?? "", /Addresses must be 500/);
});

test("limits tags to eight short, non-empty values", () => {
  assert.equal(validateReportFields({ title: "A report", description: "A description", city: "City", neighborhood: "Center", address: "", tags: ["short", "tag"] }), null);
  assert.match(validateReportFields({ title: "A report", description: "A description", city: "City", neighborhood: "Center", address: "", tags: Array.from({ length: 9 }, (_, index) => `tag-${index}`) }) ?? "", /8 tags/);
  assert.match(validateReportFields({ title: "A report", description: "A description", city: "City", neighborhood: "Center", address: "", tags: ["x".repeat(81)] }) ?? "", /80 characters/);
  assert.match(validateReportFields({ title: "A report", description: "A description", city: "City", neighborhood: "Center", address: "", tags: [""] }) ?? "", /tags/);
});

test("rejects unsupported and oversized media before upload", () => {
  assert.equal(validateMediaFile({ name: "photo.jpg", type: "image/jpeg", size: 1 }), null);
  assert.match(validateMediaFile({ name: "payload.svg", type: "image/svg+xml", size: 1 }) ?? "", /supported/);
  assert.match(validateMediaFile({ name: "large.jpg", type: "image/jpeg", size: MAX_MEDIA_BYTES + 1 }) ?? "", /50 MB/);
});

test("accepts the supported media types and enforces size and name rules", () => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "audio/mpeg",
    "audio/webm",
    "audio/mp4",
    "audio/wav",
    "audio/ogg",
  ];
  for (const type of allowedTypes) {
    assert.equal(validateMediaFile({ name: "media", type, size: 1024 }), null, `${type} should be allowed`);
  }

  assert.equal(validateMediaFile({ name: "photo.jpg", type: "application/pdf", size: 1024 }), "Choose a supported image, video, or audio file.");
  assert.equal(validateMediaFile({ name: "photo.jpg", type: "image/jpeg", size: 0 }), "Each attachment must be greater than 0 bytes and no larger than 50 MB.");
  assert.equal(validateMediaFile({ name: "photo.jpg", type: "image/jpeg", size: -1 }), "Each attachment must be greater than 0 bytes and no larger than 50 MB.");
  assert.equal(validateMediaFile({ name: "photo.jpg", type: "image/jpeg", size: MAX_MEDIA_BYTES + 1 }), "Each attachment must be greater than 0 bytes and no larger than 50 MB.");
  assert.equal(validateMediaFile({ name: "", type: "image/jpeg", size: 1024 }), "Each attachment needs a file name.");
});
