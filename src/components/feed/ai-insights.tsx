"use client";

import type { AiInsight } from "@/data/issues";
import { Button } from "@/components/ui/button";

type AiInsightsProps = {
  insight: AiInsight | null | undefined;
  canAnalyze?: boolean;
  analyzing?: boolean;
  onAnalyze?: () => void;
};

export function AiInsights({ insight, canAnalyze = false, analyzing = false, onAnalyze }: AiInsightsProps) {
  if (!insight) {
    return canAnalyze ? <Button type="button" variant="outline" size="sm" onClick={onAnalyze} disabled={analyzing}>{analyzing ? "Analyzing…" : "Analyze with AI"}</Button> : null;
  }

  return (
    <details className="rounded-md border px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium">
        AI Insights
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          AI-generated · not verification
        </span>
      </summary>
      <div className="mt-3 grid gap-3 text-sm">
        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          This section is produced by an AI model ({insight.model}). It is not an
          official confirmation and cannot mark a report verified.
        </p>
        {insight.checkedAt ? <p className="text-xs text-muted-foreground">Public sources checked {new Date(insight.checkedAt).toLocaleString()}.</p> : null}
        {insight.suggestedCategory ? <p className="text-xs text-muted-foreground">Suggested category: {insight.suggestedCategory}. This does not change the report category.</p> : null}
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Summary
          </p>
          <p className="mt-1 leading-6">{insight.summary}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Duplicate detection
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 leading-6">
            {insight.duplicateHints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Evidence analysis
          </p>
          <p className="mt-1 leading-6">{insight.evidenceNotes}</p>
        </div>
        {insight.sources?.length ? <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Related public sources</p>
          <ul className="mt-1 grid gap-1 leading-6">
            {insight.sources.map((source) => <li key={source.url}><a className="underline underline-offset-4" href={source.url} target="_blank" rel="noreferrer">{source.title}</a>{source.publishedAt ? ` · ${source.publishedAt}` : " · publication date unavailable"}</li>)}
          </ul>
        </div> : null}
        {canAnalyze ? <Button type="button" variant="outline" size="sm" onClick={onAnalyze} disabled={analyzing}>{analyzing ? "Analyzing…" : "Refresh AI analysis"}</Button> : null}
      </div>
    </details>
  );
}
