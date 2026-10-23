"use client";

import {
  ArrowBigUpIcon,
  BookmarkIcon,
  MapPinIcon,
  MessageCircleIcon,
  Share2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryLabels, type Issue } from "@/data/issues";

import { AiInsights } from "./ai-insights";
import { EvidenceSection } from "./evidence-section";
import { MediaGallery } from "./media-gallery";
import { PostComments } from "./post-comments";
import { RelativeTime } from "./relative-time";
import { VerificationBadge } from "./verification-badge";

type PostItemProps = {
  post: Issue;
  saved: boolean;
  onToggleSave: (id: string) => void;
  onUpvote: (id: string) => void;
  onAddComment: (postId: string, body: string, parentId: string | null) => void;
  canAnalyze?: boolean;
  analyzing?: boolean;
  onAnalyze?: (postId: string) => void;
};

export function PostItem({
  post,
  saved,
  onToggleSave,
  onUpvote,
  onAddComment,
  canAnalyze,
  analyzing,
  onAnalyze,
}: PostItemProps) {
  const attachments = post.attachments ?? [];
  const comments = post.comments ?? [];

  async function share() {
    const url = `${window.location.origin}/#${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied. Sharing stays local to this session.");
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  return (
    <article id={post.id} className="border-b py-5">
      <header className="flex items-start gap-3">
        <Avatar>
          <AvatarFallback>{post.reporter.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-medium">{post.reporter.name}</span>
            <span className="text-muted-foreground">
              · <RelativeTime iso={post.createdAt} />
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="size-3.5" />
              {post.address} · {post.neighborhood}{post.city ? `, ${post.city}` : ""}
            </span>
            <Badge variant="outline">{categoryLabels[post.category]}</Badge>
            <VerificationBadge status={post.verification.status} />
          </div>
        </div>
      </header>

      <h2 className="mt-3 text-lg font-semibold tracking-tight text-pretty">{post.title}</h2>
      {post.description ? (
        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7">{post.description}</p>
      ) : null}

      {post.tags && post.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      {attachments.length > 0 ? (
        <div className="mt-4">
          <MediaGallery items={attachments} layout="feed" />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Upvote ${post.title}`}
          onClick={() => onUpvote(post.id)}
        >
          <ArrowBigUpIcon data-icon="inline-start" />
          {post.upvotes}
        </Button>
        <Button type="button" variant="ghost" size="sm">
          <MessageCircleIcon data-icon="inline-start" />
          {comments.length}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={share}>
          <Share2Icon data-icon="inline-start" />
          Share
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={saved}
          onClick={() => onToggleSave(post.id)}
        >
          <BookmarkIcon
            data-icon="inline-start"
            className={saved ? "fill-current" : undefined}
          />
          {saved ? "Saved" : "Save"}
        </Button>
      </div>

      <div className="mt-4 grid gap-3">
        <PostComments
          comments={comments}
          onAdd={(body: string, parentId: string | null) =>
            onAddComment(post.id, body, parentId)
          }
        />
        <EvidenceSection
          verification={post.verification}
          attachments={attachments}
        />
        <AiInsights insight={post.aiInsight} canAnalyze={canAnalyze} analyzing={analyzing} onAnalyze={() => onAnalyze?.(post.id)} />
      </div>
    </article>
  );
}
