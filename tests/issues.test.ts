import assert from "node:assert/strict";
import test from "node:test";

import {
  categories,
  categoryLabels,
  statusLabels,
  statuses,
  unverifiedIntake,
  verificationLabels,
  verificationStatuses,
} from "../src/data/issues.ts";

test("exposes the supported report categories and labels", () => {
  assert.deepEqual([...categories].sort(), ["environment", "parks", "roads", "safety", "transit", "utilities"]);
  for (const category of categories) {
    assert.ok(categoryLabels[category].length > 0, `${category} needs a label`);
  }
});

test("exposes report statuses and verification states", () => {
  assert.deepEqual([...statuses], ["open", "in-progress", "resolved"]);
  assert.deepEqual([...verificationStatuses], ["unverified", "community-corroborated", "officially-confirmed"]);
  for (const status of statuses) {
    assert.ok(statusLabels[status].length > 0, `${status} needs a label`);
  }
  for (const status of verificationStatuses) {
    assert.ok(verificationLabels[status].length > 0, `${status} needs a label`);
  }
});

test("starts every new report as unverified intake", () => {
  const verification = unverifiedIntake("2026-10-23T10:00:00.000Z", [
    { id: "src-1", kind: "photo", label: "Photo", recordedAt: "2026-10-23T10:00:00.000Z" },
  ]);

  assert.equal(verification.status, "unverified");
  assert.equal(verification.assessedBy, "Local Intel intake");
  assert.equal(verification.assessedAt, "2026-10-23T10:00:00.000Z");
  assert.equal(verification.sources.length, 1);
  assert.equal(verification.sources[0]?.id, "src-1");
  assert.equal(verification.sources[0]?.kind, "photo");
});
