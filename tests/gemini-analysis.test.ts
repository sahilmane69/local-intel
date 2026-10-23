import assert from "node:assert/strict";
import test from "node:test";

import { cleanAnalysis, geminiError, groundingSources } from "../src/lib/gemini-analysis.ts";

test("rejects AI analysis payloads that are missing required content", () => {
  assert.equal(cleanAnalysis(null), null);
  assert.equal(cleanAnalysis("not-an-object"), null);
  assert.equal(cleanAnalysis({ summary: "Only a summary.", reasoning: "Some reasoning." }), null);
});

test("cleans, validates, and summarizes a complete AI analysis", () => {
  const result = cleanAnalysis({
    summary: "  Pothole reported near the school gate.  ",
    assessment: "unverified",
    confidence: "high",
    reasoning: "Neighbor report plus one web source.",
    knownFacts: "Street is asphalt.",
    uncertainties: "Exact depth unknown.",
    nextSteps: "Inspect during the next crew visit.",
    analysisComment: "Possible road defect.",
    evidenceNotes: "Reported by a neighbor.",
    suggestedCategory: "roads",
    duplicateHints: ["First hint", "  ", "Second hint"],
  });

  assert.ok(result);
  assert.equal(result?.summary, "Pothole reported near the school gate.");
  assert.equal(result?.assessment, "unverified");
  assert.equal(result?.confidence, "high");
  assert.equal(result?.suggestedCategory, "roads");
  assert.deepEqual(result?.duplicateHints, ["First hint", "Second hint"]);
});

test("truncates long AI analysis fields to their configured limits", () => {
  const result = cleanAnalysis({
    summary: "s".repeat(2_000),
    assessment: "community-corroborated",
    confidence: "medium",
    reasoning: "r".repeat(2_100),
    knownFacts: "k",
    uncertainties: "u",
    nextSteps: "n",
    analysisComment: "c",
    evidenceNotes: "e",
    duplicateHints: [],
  });

  assert.ok(result);
  assert.equal(result?.summary.length, 1_500);
  assert.equal(result?.reasoning.length, 2_000);
});

test("rejects analysis payloads with unknown assessment or confidence values", () => {
  const result = cleanAnalysis({
    summary: "Summary",
    assessment: "officially-confirmed",
    confidence: "high",
    reasoning: "Reasoning",
    knownFacts: "Known",
    uncertainties: "Uncertain",
    nextSteps: "Next",
    analysisComment: "Comment",
    evidenceNotes: "Evidence",
  });

  assert.equal(result, null);
});

test("keeps only validated, de-duplicated grounding sources", () => {
  const response = {
    candidates: [
      {
        groundingMetadata: {
          groundingChunks: [
            { web: { uri: "https://example.com/pothole", title: "Pothole report", publicationDate: "2026-10-20" } },
            { web: { uri: "https://example.com/pothole", title: "Duplicate source" } },
            { web: { uri: "javascript:alert(1)" } },
            { web: { uri: "https://example.com/inspect", title: "Inspection" } },
          ],
        },
      },
    ],
  };

  const sources = groundingSources(response);
  assert.equal(sources.length, 2);
  assert.equal(sources[0]?.url, "https://example.com/pothole");
  assert.equal(sources[0]?.title, "Pothole report");
  assert.equal(sources[0]?.publishedAt, "2026-10-20");
  assert.equal(sources[1]?.url, "https://example.com/inspect");
});

test("maps Gemini failures to user-safe messages and status codes", () => {
  const quotaFailure = geminiError(Object.assign(new Error("Resource exhausted: quota exceeded"), { status: 429 }));
  const [quotaMessage, quotaStatus] = quotaFailure;
  assert.equal(quotaStatus, 429);
  assert.match(quotaMessage, /rate-limited|quota/i);

  const genericFailure = geminiError(new Error("boom"));
  const [genericMessage, genericStatus] = genericFailure;
  assert.equal(genericStatus, 502);
  assert.equal(genericMessage, "Gemini could not complete the analysis. No analysis was saved.");
});
