"use client";

import { ArrowBigUpIcon, BookmarkIcon, MapPinIcon, MessageCircleIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { categoryLabels, type Issue } from "@/data/issues";

import { categoryIcons } from "./category-filters";
import { RelativeTime } from "./relative-time";
import { StatusBadge } from "./status-badge";

type IssueCardProps = {
  issue: Issue;
  saved: boolean;
  onToggleSave: (id: string) => void;
  onUpvote: (id: string) => void;
};

export function IssueCard({
  issue,
  saved,
  onToggleSave,
  onUpvote,
}: IssueCardProps) {
  const Icon = categoryIcons[issue.category];

  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">{issue.title}</CardTitle>
              <CardDescription className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{categoryLabels[issue.category]}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="size-3" />
                  {issue.address}
                </span>
                <span aria-hidden="true">·</span>
                <RelativeTime iso={issue.createdAt} />
              </CardDescription>
            </div>
          </div>
          <StatusBadge status={issue.status} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          {issue.description}
        </p>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{issue.reporter.initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {issue.reporter.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Upvote ${issue.title}`}
            onClick={() => onUpvote(issue.id)}
          >
            <ArrowBigUpIcon />
            {issue.upvotes}
          </Button>
          <Button variant="ghost" size="sm" disabled>
            <MessageCircleIcon />
            {issue.commentCount}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={saved ? "Remove bookmark" : "Save issue"}
            aria-pressed={saved}
            onClick={() => onToggleSave(issue.id)}
          >
            <BookmarkIcon className={saved ? "fill-current" : undefined} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
