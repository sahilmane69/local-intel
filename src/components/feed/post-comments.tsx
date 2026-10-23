"use client";

import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PostComment } from "@/data/issues";

import { RelativeTime } from "./relative-time";

type PostCommentsProps = {
  comments: PostComment[];
  onAdd: (body: string, parentId: string | null) => void;
};

export function PostComments({ comments, onAdd }: PostCommentsProps) {
  const [open, setOpen] = useState(comments.length > 0);
  const roots = comments.filter((comment) => comment.parentId === null);

  return (
    <div>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide comments" : `Comments (${comments.length})`}
      </Button>
      {open ? (
        <div className="mt-3 grid gap-4">
          <CommentForm
            placeholder="Add a comment"
            onSubmit={(body) => onAdd(body, null)}
          />
          {roots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            roots.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                replies={comments.filter((item) => item.parentId === comment.id)}
                onReply={(body) => onAdd(body, comment.id)}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function CommentThread({
  comment,
  replies,
  onReply,
}: {
  comment: PostComment;
  replies: PostComment[];
  onReply: (body: string) => void;
}) {
  const [replying, setReplying] = useState(false);

  return (
    <div className="grid gap-3">
      <CommentBody comment={comment} />
      <div className="pl-4">
        <Button type="button" variant="ghost" size="xs" onClick={() => setReplying((value) => !value)}>
          Reply
        </Button>
        {replying ? (
          <div className="mt-2">
            <CommentForm
              placeholder={`Reply to ${comment.author.name}`}
              onSubmit={(body) => {
                onReply(body);
                setReplying(false);
              }}
            />
          </div>
        ) : null}
        {replies.length > 0 ? (
          <div className="mt-3 grid gap-3 border-l pl-3">
            {replies.map((reply) => (
              <CommentBody key={reply.id} comment={reply} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CommentBody({ comment }: { comment: PostComment }) {
  return (
    <div className="flex gap-2">
      <Avatar size="sm">
        <AvatarFallback>{comment.author.initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-sm">
          <span className="font-medium">{comment.author.name}</span>
          <span className="text-muted-foreground">
            {" "}
            · <RelativeTime iso={comment.createdAt} />
          </span>
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{comment.body}</p>
      </div>
    </div>
  );
}

function CommentForm({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (body: string) => void;
}) {
  const [body, setBody] = useState("");

  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const next = body.trim();
        if (!next) return;
        onSubmit(next);
        setBody("");
      }}
    >
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={placeholder}
        className="min-h-16"
      />
      <Button type="submit" size="sm" className="justify-self-start" disabled={!body.trim()}>
        Comment
      </Button>
    </form>
  );
}
