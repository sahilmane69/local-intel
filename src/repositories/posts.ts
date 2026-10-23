import { mockAiInsights, mockComments } from "@/data/engagement";
import { mockIssues, type Issue, type PostComment } from "@/data/issues";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createGeminiAnalyzer } from "@/services/gemini";

function withEngagement(posts: Issue[]): Issue[] {
  return posts.map((post) => {
    const comments = post.comments ?? mockComments[post.id] ?? [];
    return {
      ...post,
      comments,
      commentCount: comments.length,
      aiInsight: post.aiInsight ?? mockAiInsights[post.id] ?? null,
    };
  });
}

export function getMockPosts(): Issue[] {
  return withEngagement(mockIssues);
}

export async function listPosts(): Promise<{ posts: Issue[]; source: "mock" | "supabase" }> {
  if (!isSupabaseConfigured()) {
    return { posts: withEngagement(mockIssues), source: "mock" };
  }

  try {
    const { createBrowserSupabaseClient } = await import("@/lib/supabase/browser");
    const client = createBrowserSupabaseClient();
    if (!client) {
      return { posts: withEngagement(mockIssues), source: "mock" };
    }

    const { data, error } = await client
      .from("posts")
      .select("id")
      .limit(1);

    if (error || !data) {
      return { posts: withEngagement(mockIssues), source: "mock" };
    }

    // Schema exists, but a full feed mapper is not wired until Auth + media URLs are tested.
    return { posts: withEngagement(mockIssues), source: "mock" };
  } catch {
    return { posts: withEngagement(mockIssues), source: "mock" };
  }
}

export async function enrichNewPost(post: Issue): Promise<Issue> {
  const analyzer = createGeminiAnalyzer();
  const comments: PostComment[] = post.comments ?? [];
  let aiInsight = post.aiInsight ?? null;

  try {
    aiInsight = await analyzer.analyzePost(post);
  } catch {
    aiInsight = {
      summary: "AI analysis was skipped.",
      duplicateHints: [],
      evidenceNotes: "No model output is available for this session.",
      generatedAt: new Date().toISOString(),
      model: "unavailable",
    };
  }

  return {
    ...post,
    comments,
    commentCount: comments.length,
    aiInsight,
  };
}
