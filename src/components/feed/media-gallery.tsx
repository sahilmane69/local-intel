"use client";

import { useState } from "react";
import { MicIcon, PlayIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { IssueAttachment } from "@/data/issues";

type MediaGalleryProps = {
  items: IssueAttachment[];
  className?: string;
  layout?: "gallery" | "feed";
};

export function MediaGallery({
  items,
  className,
  layout = "gallery",
}: MediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return null;
  }

  const images = items.filter((item) => item.kind === "image");
  const videos = items.filter((item) => item.kind === "video");
  const audio = items.filter((item) => item.kind === "audio");
  const active = activeIndex !== null ? items[activeIndex] : null;

  if (layout === "feed") {
    return (
      <div className={cn("grid gap-3", className)}>
        {images.length > 0 ? (
          <div
            className={cn(
              "grid gap-2",
              images.length === 1 ? "grid-cols-1" : "grid-cols-2"
            )}
          >
            {images.map((item) => (
              <button
                key={item.id}
                type="button"
                className="overflow-hidden rounded-md border text-left"
                onClick={() => setActiveIndex(items.indexOf(item))}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.caption ?? item.name}
                  className="max-h-[420px] w-full object-cover"
                />
                {item.caption ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">{item.caption}</p>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
        {videos.map((item) => (
          <figure key={item.id} className="overflow-hidden rounded-md border">
            <video
              src={item.url}
              poster={item.poster}
              controls
              className="max-h-[420px] w-full bg-black"
            />
            {item.caption ? (
              <figcaption className="px-3 py-2 text-sm text-muted-foreground">
                {item.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
        {audio.map((item) => (
          <figure key={item.id} className="rounded-md border px-3 py-2">
            <audio controls src={item.url} className="w-full" />
            {item.caption ? (
              <figcaption className="mt-2 text-sm text-muted-foreground">
                {item.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
        <MediaViewer
          items={items}
          active={active}
          activeIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
          onIndexChange={setActiveIndex}
        />
      </div>
    );
  }

  return (
    <>
      <div className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {items.map((item, index) => (
          <Button
            key={item.id}
            type="button"
            variant="outline"
            className="h-auto flex-col items-stretch gap-0 overflow-hidden p-0"
            onClick={() => setActiveIndex(index)}
          >
            <MediaThumb item={item} />
            <span className="truncate px-2 py-1.5 text-left text-xs font-normal text-muted-foreground">
              {item.caption ?? item.name}
            </span>
          </Button>
        ))}
      </div>
      <MediaViewer
        items={items}
        active={active}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onIndexChange={setActiveIndex}
      />
    </>
  );
}

function MediaViewer({
  items,
  active,
  activeIndex,
  onClose,
  onIndexChange,
}: {
  items: IssueAttachment[];
  active: IssueAttachment | null;
  activeIndex: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  return (
    <Dialog
      open={active !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[min(92vh,840px)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{active?.caption ?? active?.name ?? "Media"}</DialogTitle>
          <DialogDescription>
            Files are attached to the report when Supabase is configured.
          </DialogDescription>
        </DialogHeader>
        {active ? <MediaPlayer item={active} /> : null}
        {items.length > 1 && activeIndex !== null ? (
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={activeIndex === 0}
              onClick={() => onIndexChange(Math.max(0, activeIndex - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={activeIndex === items.length - 1}
              onClick={() => onIndexChange(Math.min(items.length - 1, activeIndex + 1))}
            >
              Next
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MediaThumb({ item }: { item: IssueAttachment }) {
  if (item.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.url} alt="" className="h-36 w-full object-cover" />
    );
  }

  if (item.kind === "video") {
    return (
      <span className="relative block h-36 w-full bg-muted">
        <video
          src={item.url}
          poster={item.poster}
          muted
          preload="metadata"
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 grid place-items-center bg-black/25">
          <PlayIcon className="size-8 text-white" />
        </span>
      </span>
    );
  }

  return (
    <span className="flex h-36 w-full items-center justify-center bg-muted">
      <MicIcon className="size-8 text-muted-foreground" />
    </span>
  );
}

export function MediaPlayer({ item }: { item: IssueAttachment }) {
  if (item.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt={item.caption ?? item.name}
        className="max-h-[60vh] w-full rounded-md object-contain"
      />
    );
  }

  if (item.kind === "video") {
    return (
      <video
        src={item.url}
        poster={item.poster}
        controls
        className="max-h-[60vh] w-full rounded-md bg-black"
      />
    );
  }

  return <audio controls src={item.url} className="w-full" />;
}
