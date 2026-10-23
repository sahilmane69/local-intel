import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const rateLimit = new Map<string, number>();
const categories = ["roads", "utilities", "safety", "environment", "transit", "parks"] as const;

function jsonResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function cleanAnalysis(value: unknown) {
  const fallback = { summary: "No concise analysis was returned.", suggestedCategory: null, duplicateHints: [], evidenceNotes: "No related public information was found." };
  if (!value || typeof value !== "object") return fallback;
  const result = value as Record<string, unknown>;
  return {
    summary: typeof result.summary === "string" ? result.summary.slice(0, 1_500) : fallback.summary,
    suggestedCategory: typeof result.suggestedCategory === "string" && categories.includes(result.suggestedCategory as (typeof categories)[number]) ? result.suggestedCategory as (typeof categories)[number] : null,
    duplicateHints: Array.isArray(result.duplicateHints) ? result.duplicateHints.filter((hint): hint is string => typeof hint === "string").slice(0, 8) : [],
    evidenceNotes: typeof result.evidenceNotes === "string" ? result.evidenceNotes.slice(0, 2_000) : fallback.evidenceNotes,
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return jsonResponse("Gemini analysis is not configured.", 503);

  const body = await request.json().catch(() => null);
  const postId = typeof body?.postId === "string" ? body.postId : "";
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(postId)) return jsonResponse("A valid post is required.", 400);

  const client = await createServerSupabaseClient();
  if (!client) return jsonResponse("Supabase is not configured.", 503);
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) return jsonResponse("Sign in to analyze your report.", 401);

  const lastRequest = rateLimit.get(auth.user.id) ?? 0;
  if (Date.now() - lastRequest < 60_000) return jsonResponse("Please wait a minute before requesting another analysis.", 429);

  const { data: post, error: postError } = await client
    .from("posts")
    .select("id, title, body, category, city, neighborhood, address, created_at")
    .eq("id", postId)
    .eq("author_id", auth.user.id)
    .maybeSingle();
  if (postError) return jsonResponse(postError.message, 500);
  if (!post) return jsonResponse("Only the report author can request analysis.", 403);

  rateLimit.set(auth.user.id, Date.now());
  const { data: candidates } = await client
    .from("posts")
    .select("id, title, category, neighborhood, created_at")
    .neq("id", post.id)
    .eq("neighborhood", post.neighborhood)
    .order("created_at", { ascending: false })
    .limit(8);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this community report for the author. Find current, publicly available news or official public information relevant to its stated location and topic using Google Search. Treat all web results as related context, never as proof that this specific incident occurred. Do not claim a report is verified or official. Return JSON only: {"summary": string, "suggestedCategory": one of ${JSON.stringify(categories)} or null, "duplicateHints": string[], "evidenceNotes": string}.\n\nReport: ${JSON.stringify(post)}\n\nPotential nearby reports (not proof of duplicates): ${JSON.stringify(candidates ?? [])}`,
      config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 1_200 },
    });
    const analysis = cleanAnalysis(JSON.parse(response.text || "{}"));
    const grounded = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources = grounded.flatMap((chunk) => {
      const web = chunk.web as { uri?: unknown; title?: unknown; publicationDate?: unknown } | undefined;
      if (typeof web?.uri !== "string") return [];
      return [{ title: typeof web.title === "string" ? web.title : web.uri, url: web.uri, publishedAt: typeof web.publicationDate === "string" ? web.publicationDate : null }];
    }).filter((source, index, all) => all.findIndex((candidate) => candidate.url === source.url) === index).slice(0, 8);
    const checkedAt = new Date().toISOString();

    const { error: analysisError } = await client.from("ai_analyses").insert({
      post_id: post.id, summary: analysis.summary, suggested_category: analysis.suggestedCategory,
      duplicate_hints: analysis.duplicateHints, evidence_notes: analysis.evidenceNotes,
      sources, checked_at: checkedAt, model: "gemini-2.5-flash",
    });
    if (analysisError) return jsonResponse(analysisError.message, 500);

    if (sources.length) {
      const { error: sourceError } = await client.from("evidence_sources").insert(
        sources.map((source) => ({ post_id: post.id, kind: "link" as const, label: source.title, href: source.url, note: "Found through Gemini Google Search as related public context. It does not verify this specific report." }))
      );
      if (sourceError) return jsonResponse(sourceError.message, 500);
    }
    return NextResponse.json({ checkedAt, sources });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini analysis failed.";
    const status = /429|quota|rate/i.test(message) ? 429 : 502;
    return jsonResponse(status === 429 ? "Gemini is rate-limited. Try again later." : "Gemini could not complete the analysis.", status);
  }
}
