import type { AiInsight, Issue } from "@/data/issues";

export type GeminiAnalyzer = {
  analyzePost: (post: Issue) => Promise<AiInsight>;
};

export class MockGeminiAnalyzer implements GeminiAnalyzer {
  async analyzePost(post: Issue): Promise<AiInsight> {
    const mediaKinds = (post.attachments ?? []).map((item) => item.kind);
    const duplicateHints =
      post.neighborhood === "Harbor East"
        ? ["Nearby corridor activity: hydrant leak on 9th & Harbor."]
        : ["No close duplicate detected in the current local mock set."];

    return {
      summary: `${post.title} is described in ${post.neighborhood}. This is a draft reading of neighbor text and attached media kinds (${mediaKinds.join(", ") || "none"}).`,
      duplicateHints,
      evidenceNotes:
        "AI can flag missing context or demo media. It cannot confirm that a photo, video, or link is authentic.",
      generatedAt: new Date().toISOString(),
      model: "gemini-mock",
    };
  }
}

export function createGeminiAnalyzer(): GeminiAnalyzer {
  return new MockGeminiAnalyzer();
}
