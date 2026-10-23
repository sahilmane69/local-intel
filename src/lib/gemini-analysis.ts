import { isSafeExternalUrl } from "./post-validation";

export const categories = ["roads", "utilities", "safety", "environment", "transit", "parks"] as const;
export const assessments = ["unverified", "community-corroborated"] as const;
export const confidences = ["low", "medium", "high"] as const;
export const ANALYSIS_REUSE_WINDOW_MS = 24 * 60 * 60 * 1_000;
export const REQUEST_COOLDOWN_MS = 60_000;
export const REFRESH_COOLDOWN_MS = 5 * 60_000;
export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";

export type GeminiSource = { title: string; url: string; publishedAt?: string | null };
export type AnalysisPost = {
  id: string;
  title: string;
  body: string;
  category: string;
  city: string | null;
  neighborhood: string;
  address: string | null;
  created_at: string;
  post_media: Array<{ kind: string; mime_type: string; file_name: string; caption: string | null; created_at: string }>;
  evidence_sources: Array<{ kind: string; label: string; href: string | null; note: string | null; recorded_at: string | null }>;
};

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function cleanAnalysis(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const result = value as Record<string, unknown>;
  const summary = text(result.summary, 1_500);
  const reasoning = text(result.reasoning, 2_000);
  const knownFacts = text(result.knownFacts, 1_500);
  const uncertainties = text(result.uncertainties, 1_500);
  const nextSteps = text(result.nextSteps, 1_500);
  const analysisComment = text(result.analysisComment, 1_500);
  const evidenceNotes = text(result.evidenceNotes, 2_000);
  const assessment = assessments.includes(result.assessment as (typeof assessments)[number]) ? result.assessment as (typeof assessments)[number] : null;
  const confidence = confidences.includes(result.confidence as (typeof confidences)[number]) ? result.confidence as (typeof confidences)[number] : null;
  if (!summary || !reasoning || !knownFacts || !uncertainties || !nextSteps || !analysisComment || !evidenceNotes || !assessment || !confidence) return null;

  return {
    summary, reasoning, knownFacts, uncertainties, nextSteps, analysisComment, evidenceNotes, assessment, confidence,
    suggestedCategory: typeof result.suggestedCategory === "string" && categories.includes(result.suggestedCategory as (typeof categories)[number]) ? result.suggestedCategory as (typeof categories)[number] : null,
    duplicateHints: Array.isArray(result.duplicateHints) ? result.duplicateHints.map((hint) => text(hint, 300)).filter(Boolean).slice(0, 8) : [],
  };
}

type GeminiResponseLike = {
  candidates?: Array<{
    groundingMetadata?: {
      groundingChunks?: Array<{
        web?: { uri?: unknown; title?: unknown; publicationDate?: unknown };
      }>;
    };
  }>;
};

export function groundingSources(response: GeminiResponseLike) {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  return chunks.flatMap((chunk): GeminiSource[] => {
    const web = chunk.web;
    if (typeof web?.uri !== "string" || !isSafeExternalUrl(web.uri)) return [];
    return [{ title: typeof web.title === "string" ? web.title.slice(0, 300) : web.uri, url: web.uri, publishedAt: typeof web.publicationDate === "string" ? web.publicationDate.slice(0, 120) : null }];
  }).filter((source, index, all) => all.findIndex((candidate) => candidate.url === source.url) === index).slice(0, 8);
}

export function geminiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Gemini could not complete the analysis.";
  const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : undefined;
  if (status === 429 || /\b429\b|quota|resource_exhausted|rate[ -]?limit/i.test(message)) return ["Gemini is rate-limited or out of quota. Check the Gemini project and try again later.", 429] as const;
  if (status === 503 || /\b503\b|high demand|unavailable/i.test(message)) return ["Gemini is temporarily experiencing high demand. No analysis was saved; please try again shortly.", 503] as const;
  if (/404|not_found|model.*available/i.test(message)) return ["The configured Gemini model is unavailable. Set GEMINI_MODEL to a model available to this API key.", 503] as const;
  if (/api.?key|unauthenticated|permission/i.test(message)) return ["Gemini rejected the server configuration. Check GEMINI_API_KEY and model access.", 503] as const;
  return ["Gemini could not complete the analysis. No analysis was saved.", 502] as const;
}
