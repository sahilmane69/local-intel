"use client";

import type { AiInsight } from "@/data/issues";

type AiInsightsProps = {
  insight: AiInsight | null | undefined;
};

export function AiInsights({ insight }: AiInsightsProps) {
  if (!insight) {
    return null;
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
      </div>
    </details>
  );
}
