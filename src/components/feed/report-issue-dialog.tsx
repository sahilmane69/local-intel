"use client";

import { useRef, useState } from "react";
import {
  ImagePlusIcon,
  Loader2Icon,
  MapPinIcon,
  MicIcon,
  SquareIcon,
  Trash2Icon,
  UploadIcon,
  VideoIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  categories,
  categoryLabels,
  neighborhoods,
  unverifiedIntake,
  type Category,
  type EvidenceSource,
  type Issue,
  type IssueAttachment,
  type IssueCoordinates,
  type MediaKind,
  type Neighborhood,
} from "@/data/issues";

import { MediaPlayer } from "./media-gallery";

type ReportIssueDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultNeighborhood: Neighborhood | "all";
  onSubmit: (issue: Issue) => void;
};

const LIMITS: Record<MediaKind, number> = {
  image: 6,
  video: 2,
  audio: 3,
};

function createLocalId() {
  return crypto.randomUUID();
}

function parseTags(value: string) {
  return [
    ...new Set(
      value
        .split(/[,#]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
    ),
  ].slice(0, 8);
}

function parseList(value: string) {
  return [
    ...new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ].slice(0, 6);
}

function pickRecorderMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
  ];
  return types.find(
    (type) =>
      typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)
  );
}

function permissionMessage(error: unknown, kind: "location" | "microphone") {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return kind === "location"
      ? "Location permission was denied. Enter an address instead."
      : "Microphone permission was denied. You can still upload an audio file.";
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "number"
  ) {
    if (error.code === 1) {
      return "Location permission was denied. Enter an address instead.";
    }
    if (error.code === 3) {
      return "GPS timed out. Enter an address instead.";
    }
  }
  return kind === "location"
    ? "Could not read GPS. Enter an address instead."
    : "Could not start recording. You can still upload an audio file.";
}

function kindFromFile(file: File): MediaKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

export function ReportIssueDialog({
  open,
  onOpenChange,
  defaultNeighborhood,
  onSubmit,
}: ReportIssueDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("roads");
  const [neighborhoodOverride, setNeighborhoodOverride] =
    useState<Neighborhood | null>(null);
  const [address, setAddress] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [evidence, setEvidence] = useState("");
  const [evidenceLinks, setEvidenceLinks] = useState("");
  const [sourcePosts, setSourcePosts] = useState("");
  const [media, setMedia] = useState<IssueAttachment[]>([]);
  const [coordinates, setCoordinates] = useState<IssueCoordinates | null>(null);
  const [locationSource, setLocationSource] = useState<"gps" | "manual">(
    "manual"
  );
  const [locating, setLocating] = useState(false);
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<IssueAttachment[]>([]);
  const skipRevokeOnCloseRef = useRef(false);

  function updateMedia(
    next: IssueAttachment[] | ((current: IssueAttachment[]) => IssueAttachment[])
  ) {
    setMedia((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      mediaRef.current = resolved;
      return resolved;
    });
  }

  const neighborhood =
    neighborhoodOverride ??
    (defaultNeighborhood === "all" ? "Downtown" : defaultNeighborhood);

  const imageCount = media.filter((item) => item.kind === "image").length;
  const videoCount = media.filter((item) => item.kind === "video").length;
  const audioCount = media.filter((item) => item.kind === "audio").length;

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    setRecording(false);
    stopStream();
  }

  function flushRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
      recorderRef.current = null;
      setRecording(false);
      stopStream();
    });
  }

  function revoke(url: string) {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }

  function resetFields() {
    setTitle("");
    setDescription("");
    setCategory("roads");
    setNeighborhoodOverride(null);
    setAddress("");
    setTagsInput("");
    setEvidence("");
    setEvidenceLinks("");
    setSourcePosts("");
    mediaRef.current = [];
    setMedia([]);
    setCoordinates(null);
    setLocationSource("manual");
    setLocating(false);
    setSubmitting(false);
    setFormError(null);
    setRecording(false);
  }

  function discardDrafts() {
    stopRecording();
    mediaRef.current.forEach((item) => revoke(item.url));
  }

  async function captureGps() {
    if (!navigator.geolocation) {
      toast.error("GPS is not available in this browser. Enter an address instead.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoordinates(next);
        setLocationSource("gps");
        setAddress((current) =>
          current.trim()
            ? current
            : `${next.lat.toFixed(5)}, ${next.lng.toFixed(5)}`
        );
        setLocating(false);
        toast.success("Current location captured. It is stored only in this session.");
      },
      (error) => {
        setLocating(false);
        toast.error(permissionMessage(error, "location"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function startRecording() {
    if (audioCount >= LIMITS.audio) {
      toast.error(`You can attach up to ${LIMITS.audio} audio clips.`);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Voice recording is not supported here. Upload an audio file instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (blob.size === 0) {
          toast.error("No audio was captured. Try again or upload a file.");
          return;
        }
        const nextAudio: IssueAttachment = {
          id: createLocalId(),
          kind: "audio",
          name: `voice-note-${mediaRef.current.filter((item) => item.kind === "audio").length + 1}.webm`,
          mimeType: blob.type,
          url: URL.createObjectURL(blob),
          caption: "Voice note recorded in this session",
        };
        updateMedia((current) => [...current, nextAudio]);
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (error) {
      stopStream();
      toast.error(permissionMessage(error, "microphone"));
    }
  }

  function addFiles(fileList: FileList | null, expected?: MediaKind) {
    if (!fileList) return;
    const incoming = Array.from(fileList)
      .map((file) => ({ file, kind: kindFromFile(file) }))
      .filter((entry): entry is { file: File; kind: MediaKind } => {
        if (!entry.kind) return false;
        if (expected && entry.kind !== expected) return false;
        return true;
      });

    if (incoming.length === 0) {
      toast.error("Choose a supported image, video, or audio file.");
      return;
    }

    const accepted: IssueAttachment[] = [];
    const counts = {
      image: imageCount,
      video: videoCount,
      audio: audioCount,
    };

    for (const { file, kind } of incoming) {
      if (counts[kind] >= LIMITS[kind]) {
        toast.error(`You can attach up to ${LIMITS[kind]} ${kind} files.`);
        continue;
      }
      counts[kind] += 1;
      accepted.push({
        id: createLocalId(),
        kind,
        name: file.name,
        mimeType: file.type,
        url: URL.createObjectURL(file),
        caption: file.name,
      });
    }

    if (accepted.length > 0) {
      updateMedia((current) => [...current, ...accepted]);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (recording) {
      await flushRecording();
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedAddress = address.trim();
    const trimmedEvidence = evidence.trim();
    const tags = parseTags(tagsInput);
    const links = parseList(evidenceLinks);
    const relatedPosts = parseList(sourcePosts);
    const draftMedia = mediaRef.current;
    const hasText = trimmedTitle.length > 0 || trimmedDescription.length > 0;
    const hasMedia = draftMedia.length > 0;
    const hasEvidence =
      trimmedEvidence.length > 0 ||
      tags.length > 0 ||
      links.length > 0 ||
      relatedPosts.length > 0;

    if (!hasText && !hasMedia && !hasEvidence) {
      setFormError(
        "Add a title, description, photo, video, voice note, or other evidence before submitting."
      );
      toast.error("The report needs at least one meaningful detail.");
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 650));

      const createdAt = new Date().toISOString();
      const resolvedTitle =
        trimmedTitle ||
        (draftMedia.some((item) => item.kind === "image") ? "Photo report" : null) ||
        (draftMedia.some((item) => item.kind === "video") ? "Video report" : null) ||
        (draftMedia.some((item) => item.kind === "audio") ? "Voice report" : null) ||
        trimmedDescription.slice(0, 72) ||
        tags[0] ||
        "Community report";

      const sources: EvidenceSource[] = [
        ...draftMedia.map((item) => ({
          id: `src-${item.id}`,
          kind: (item.kind === "image" ? "photo" : item.kind) as EvidenceSource["kind"],
          label: item.caption ?? item.name,
          attachmentId: item.id,
          recordedAt: createdAt,
          note: "Session preview only. Not independently confirmed.",
        })),
        ...links.map((href) => ({
          id: createLocalId(),
          kind: "link" as const,
          label: href,
          href,
          note: "Submitted as a supporting link. Authenticity is not confirmed.",
        })),
        ...relatedPosts.map((href) => ({
          id: createLocalId(),
          kind: "source-post" as const,
          label: "Related source post",
          href,
        })),
      ];

      onSubmit({
        id: `iss-${createLocalId()}`,
        title: resolvedTitle,
        description: trimmedDescription,
        category,
        status: "open",
        neighborhood,
        address: trimmedAddress || (coordinates ? "GPS coordinates" : "Location not specified"),
        upvotes: 1,
        commentCount: 0,
        reporter: { name: "Alex Chen", initials: "AC" },
        createdAt,
        tags,
        evidence: trimmedEvidence || undefined,
        coordinates,
        locationSource,
        attachments: draftMedia,
        verification: unverifiedIntake(createdAt, sources),
        comments: [],
        aiInsight: null,
      });

      toast.success(
        "Report added as Unverified. Media stays in this session and is not treated as confirmed evidence."
      );
      skipRevokeOnCloseRef.current = true;
      mediaRef.current = [];
      resetFields();
      onOpenChange(false);
    } catch {
      toast.error("Could not add the report. Try again.");
      setFormError("Submission failed. Nothing was sent to a server.");
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (submitting) return;
        if (!next) {
          if (!skipRevokeOnCloseRef.current) discardDrafts();
          skipRevokeOnCloseRef.current = false;
          resetFields();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,820px)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b p-4 pr-12">
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>
              New reports start as Unverified. Photos, video, and audio stay in this
              browser session only.
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4">
            <label className="grid gap-1.5 text-sm font-medium" htmlFor="issue-title">
              Title
              <Input
                id="issue-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Optional if you attach media"
                disabled={submitting}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium" htmlFor="issue-description">
              Detailed description
              <Textarea
                id="issue-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What did you see, when, and why does it matter?"
                className="min-h-24"
                disabled={submitting}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">
                Category
                <Select
                  value={category}
                  onValueChange={(value) => {
                    if (value) setCategory(value as Category);
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{categoryLabels[category]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {categoryLabels[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                Neighborhood
                <Select
                  value={neighborhood}
                  onValueChange={(value) => {
                    if (value) setNeighborhoodOverride(value as Neighborhood);
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{neighborhood}</SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {neighborhoods.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>

            <div className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">Location</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={captureGps}
                  disabled={submitting || locating}
                >
                  {locating ? (
                    <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <MapPinIcon data-icon="inline-start" />
                  )}
                  {locating ? "Locating…" : "Use current GPS"}
                </Button>
              </div>
              <Input
                id="issue-address"
                value={address}
                onChange={(event) => {
                  setAddress(event.target.value);
                  setLocationSource("manual");
                }}
                placeholder="Street, park, intersection, or pasted coordinates"
                disabled={submitting}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">Photos, video, and voice</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitting || imageCount >= LIMITS.image}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImagePlusIcon data-icon="inline-start" />
                    Images
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitting || videoCount >= LIMITS.video}
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <VideoIcon data-icon="inline-start" />
                    Video
                  </Button>
                  {recording ? (
                    <Button type="button" variant="secondary" size="sm" onClick={stopRecording}>
                      <SquareIcon data-icon="inline-start" />
                      Stop
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={submitting || audioCount >= LIMITS.audio}
                      onClick={startRecording}
                    >
                      <MicIcon data-icon="inline-start" />
                      Record
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitting || audioCount >= LIMITS.audio}
                    onClick={() => audioInputRef.current?.click()}
                  >
                    <UploadIcon data-icon="inline-start" />
                    Audio file
                  </Button>
                </div>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  addFiles(event.target.files, "image");
                  event.target.value = "";
                }}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  addFiles(event.target.files, "video");
                  event.target.value = "";
                }}
              />
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  addFiles(event.target.files, "audio");
                  event.target.value = "";
                }}
              />
              {recording ? (
                <p className="text-xs text-muted-foreground">Recording… tap stop when finished.</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Up to {LIMITS.image} images, {LIMITS.video} videos, and {LIMITS.audio} audio
                  clips. Previews are not a permanent upload.
                </p>
              )}
              {media.length > 0 ? (
                <div className="grid gap-2">
                  {media.map((item) => (
                    <div key={item.id} className="relative rounded-md border p-2">
                      {item.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.url}
                          alt={item.name}
                          className="h-32 w-full rounded-sm object-cover"
                        />
                      ) : (
                        <MediaPlayer item={item} />
                      )}
                      <div className="mt-2 grid gap-2">
                        <Input
                          value={item.caption ?? ""}
                          onChange={(event) => {
                            const caption = event.target.value;
                            updateMedia((current) =>
                              current.map((entry) =>
                                entry.id === item.id ? { ...entry, caption } : entry
                              )
                            );
                          }}
                          placeholder="Optional caption"
                          disabled={submitting}
                        />
                        <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-muted-foreground">{item.name}</p>
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="secondary"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => {
                            revoke(item.url);
                            updateMedia((current) =>
                              current.filter((entry) => entry.id !== item.id)
                            );
                          }}
                        >
                          <Trash2Icon />
                        </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <label className="grid gap-1.5 text-sm font-medium" htmlFor="issue-tags">
              Tags
              <Input
                id="issue-tags"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="Optional: pothole, night, school-zone"
                disabled={submitting}
              />
            </label>
            {parseTags(tagsInput).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {parseTags(tagsInput).map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}

            <label className="grid gap-1.5 text-sm font-medium" htmlFor="issue-evidence">
              Supporting notes
              <Textarea
                id="issue-evidence"
                value={evidence}
                onChange={(event) => setEvidence(event.target.value)}
                placeholder="Optional context. This does not verify the report."
                disabled={submitting}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium" htmlFor="issue-links">
              Evidence links
              <Textarea
                id="issue-links"
                value={evidenceLinks}
                onChange={(event) => setEvidenceLinks(event.target.value)}
                placeholder="Optional URLs, one per line. Links are not treated as official confirmation."
                disabled={submitting}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium" htmlFor="issue-source-posts">
              Related source posts
              <Input
                id="issue-source-posts"
                value={sourcePosts}
                onChange={(event) => setSourcePosts(event.target.value)}
                placeholder="Optional: #iss-102 or a URL"
                disabled={submitting}
              />
            </label>

            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
          </div>

          <DialogFooter className="px-4">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2Icon className="animate-spin" data-icon="inline-start" />
              ) : null}
              {submitting ? "Adding to feed…" : "Submit unverified report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
