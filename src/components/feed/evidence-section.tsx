"use client";

import { ExternalLinkIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { isSafeExternalUrl } from "@/lib/post-validation";
import type { EvidenceSource, IssueAttachment, Verification } from "@/data/issues";

import { MediaPlayer } from "./media-gallery";
import { RelativeTime } from "./relative-time";
import { VerificationBadge } from "./verification-badge";

const sourceKindLabels: Record<EvidenceSource["kind"], string> = {
  photo: "Photo",
  video: "Video",
  audio: "Audio",
  link: "Link",
  "source-post": "Source post",
};

type EvidenceSectionProps = {
  verification: Verification;
  attachments: IssueAttachment[];
};

export function EvidenceSection({
  verification,
  attachments,
}: EvidenceSectionProps) {
  return (
    <details className="rounded-md border px-3 py-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span>Evidence & Verification</span>
        <VerificationBadge status={verification.status} />
      </summary>
      <div className="mt-3 grid gap-3">
        <p className="text-xs text-muted-foreground">
          Status comes from human review or a named agency—not from an automated score.
        </p>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Assessed by</dt>
            <dd>{verification.assessedBy}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Assessed</dt>
            <dd>
              <RelativeTime iso={verification.assessedAt} />
            </dd>
          </div>
        </dl>
        <p className="text-sm leading-6 text-muted-foreground">{verification.notes}</p>
        <Separator />
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Evidence sources
        </p>
        <ul className="grid gap-2">
          {verification.sources.map((source) => (
            <EvidenceSourceRow
              key={source.id}
              source={source}
              attachment={attachments.find((item) => item.id === source.attachmentId)}
            />
          ))}
        </ul>
      </div>
    </details>
  );
}

function EvidenceSourceRow({
  source,
  attachment,
}: {
  source: EvidenceSource;
  attachment?: IssueAttachment;
}) {
  return (
    <li className="rounded-md border px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{source.label}</p>
          <p className="text-xs text-muted-foreground">
            {sourceKindLabels[source.kind]}
            {source.recordedAt ? (
              <>
                {" "}
                · <RelativeTime iso={source.recordedAt} />
              </>
            ) : null}
          </p>
        </div>
        {source.href && isSafeExternalUrl(source.href) ? (
          <a
            href={source.href}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Open
            <ExternalLinkIcon data-icon="inline-end" />
          </a>
        ) : null}
      </div>
      {source.note ? (
        <p className="mt-1 text-xs text-muted-foreground">{source.note}</p>
      ) : null}
      {attachment && (attachment.kind === "audio" || attachment.kind === "video") ? (
        <div className="mt-2">
          <MediaPlayer item={attachment} />
        </div>
      ) : null}
    </li>
  );
}
