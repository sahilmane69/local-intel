"use client";

import type { AiInsight } from "@/data/issues";
import { Button } from "@/components/ui/button";
import { isSafeExternalUrl } from "@/lib/post-validation";

type AiInsightsProps = {
  insight: AiInsight | null | undefined;
  canAnalyze?: boolean;
  analyzing?: boolean;
  onAnalyze?: (refresh: boolean) => void;
};

function formatCheckedAt(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "an unknown time"
    : date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
}

export function AiInsights({ insight, canAnalyze = false, analyzing = false, onAnalyze }: AiInsightsProps) {
  if (!insight) {
    return canAnalyze ? <Button type="button" variant="outline" size="sm" onClick={() => onAnalyze?.(false)} disabled={analyzing}>{analyzing ? "Verifying…" : "Verify with AI"}</Button> : null;
  }

  return (
    <details className="rounded-md border px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium">
        AI Analysis
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          AI-generated comment · not official verification
        </span>
      </summary>
      <div className="mt-3 grid gap-3 text-sm">
        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          This AI-generated comment is separate from community comments. It cannot
          officially verify a report or change its verification status.
        </p>
        {insight.checkedAt ? <p className="text-xs text-muted-foreground">Public sources checked {formatCheckedAt(insight.checkedAt)}.</p> : null}
        {insight.assessment ? <div><p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">AI assessment</p><p className="mt-1 leading-6 capitalize">{insight.assessment.replace("-", " ")} · {insight.confidence ?? "unknown"} confidence</p></div> : null}
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">AI-generated comment</p>
          <p className="mt-1 leading-6">{insight.analysisComment ?? insight.summary}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">What is known</p>
          <p className="mt-1 leading-6">{insight.knownFacts ?? insight.summary}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">What remains uncertain</p>
          <p className="mt-1 leading-6">{insight.uncertainties ?? insight.evidenceNotes}</p>
        </div>
        <div><p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Suggested next steps</p><p className="mt-1 leading-6">{insight.nextSteps ?? "Seek first-hand evidence or an update from the responsible authority."}</p></div>
        {insight.reasoning ? <div><p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Reasoning</p><p className="mt-1 leading-6">{insight.reasoning}</p></div> : null}
        {insight.suggestedCategory ? <p className="text-xs text-muted-foreground">Suggested category: {insight.suggestedCategory}. This does not change the report category.</p> : null}
        {insight.duplicateHints.length ? <div><p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Related reports</p><ul className="mt-1 list-disc space-y-1 pl-5 leading-6">{insight.duplicateHints.map((hint) => <li key={hint}>{hint}</li>)}</ul></div> : null}
        {insight.sources?.length ? <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Related public sources</p>
          <ul className="mt-1 grid gap-1 leading-6">
            {insight.sources.filter((source) => isSafeExternalUrl(source.url)).map((source) => <li key={source.url}><a className="underline underline-offset-4" href={source.url} target="_blank" rel="noreferrer">{source.title}</a>{source.publishedAt ? ` · ${source.publishedAt}` : " · publication date unavailable"}</li>)}
          </ul>
        </div> : null}
        {canAnalyze ? <Button type="button" variant="outline" size="sm" onClick={() => onAnalyze?.(true)} disabled={analyzing}>{analyzing ? "Refreshing…" : "Refresh AI analysis"}</Button> : null}
      </div>
    </details>
  );
}
