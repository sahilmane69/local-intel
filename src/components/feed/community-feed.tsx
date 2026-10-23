"use client";

import { useCallback, useMemo, useState } from "react";
import { CompassIcon, MenuIcon, PlusIcon, SearchIcon, UserRoundIcon } from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { type Category, type Issue } from "@/data/issues";
import {
  addComment as createComment,
  createPost,
  listSavedPostIds,
  refreshPosts,
  toggleSavedPost,
  toggleVote,
  type FeedResult,
} from "@/repositories/posts";

import { AppSidebar } from "./app-sidebar";
import { AccountDialog, type AccountProfile } from "./account-dialog";
import { CategoryFilters } from "./category-filters";
import { LocationSelector } from "./location-selector";
import { MobileNav } from "./mobile-nav";
import { PostItem } from "./post-item";
import { ReportIssueDialog } from "./report-issue-dialog";
import type { AppView } from "./types";
import { useSidebarCollapsed } from "./use-sidebar-collapsed";

// Change this product setting to adjust the Nearby feed radius.
const NEARBY_RADIUS_KM = 10;

export function CommunityFeed({ initialFeed }: { initialFeed?: FeedResult }) {
  const [issues, setIssues] = useState<Issue[]>(() => initialFeed?.posts ?? []);
  const [source, setSource] = useState<FeedResult["source"]>(initialFeed?.source ?? "supabase");
  const [feedError, setFeedError] = useState(initialFeed?.error ?? null);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [viewerProfile, setViewerProfile] = useState<AccountProfile | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [analyzingPostId, setAnalyzingPostId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [location, setLocation] = useState<string | "all">("all");
  const [view, setView] = useState<AppView>("feed");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarCollapsed();

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const result = await refreshPosts();
    setLoading(false);
    setSource(result.source);
    setFeedError(result.error ?? null);
    if (!result.error) setIssues(result.posts);
  }, []);

  const locationOptions = useMemo(
    () => [...new Set(issues.map((issue) => issue.neighborhood).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [issues]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return issues
      .filter((issue) => {
        const matchesCategory = category === "all" || issue.category === category;
        const matchesLocation =
          location === "all" || issue.neighborhood === location;
        const matchesQuery =
          needle.length === 0 ||
          issue.title.toLowerCase().includes(needle) ||
          issue.description.toLowerCase().includes(needle) ||
          issue.address.toLowerCase().includes(needle) ||
          (issue.tags ?? []).some((tag) => tag.toLowerCase().includes(needle));
        const matchesSaved = view !== "saved" || savedIds.includes(issue.id);
        const matchesNearby = view !== "nearby" || isWithinRadius(
          viewerProfile?.latitude,
          viewerProfile?.longitude,
          issue.coordinates?.lat,
          issue.coordinates?.lng,
          NEARBY_RADIUS_KM
        );

        return (
          matchesCategory &&
          matchesLocation &&
          matchesQuery &&
          matchesSaved &&
          matchesNearby
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [category, issues, location, query, savedIds, view, viewerProfile]);

  const openCount = issues.filter((issue) => {
    const inLocation = location === "all" || issue.neighborhood === location;
    return inLocation && issue.status !== "resolved";
  }).length;

  async function toggleSave(id: string) {
    try {
      await toggleSavedPost(id);
      setSavedIds(await listSavedPostIds());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update saved issues.");
    }
  }

  async function upvote(id: string) {
    try {
      await toggleVote(id);
      await loadFeed();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your vote.");
    }
  }

  async function addComment(postId: string, body: string, parentId: string | null) {
    try {
      await createComment(postId, body, parentId);
      await loadFeed();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add your comment.");
    }
  }

  async function addIssue(issue: Issue) {
    const created = await createPost(issue);
    setIssues((current) => [created, ...current.filter((item) => item.id !== created.id)]);
    toast.success("Report published as Unverified.");
    setView("feed");
    setCategory("all");
    setQuery("");
  }

  async function analyzePost(postId: string) {
    setAnalyzingPostId(postId);
    try {
      const response = await fetch("/api/posts/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId }) });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error ?? "Could not analyze this report.");
      await loadFeed();
      toast.success("AI analysis added as related public context, not verification.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not analyze this report.");
    } finally {
      setAnalyzingPostId(null);
    }
  }

  async function handleSessionChange(user: { id: string } | null, profile: AccountProfile | null) {
    setViewerId(user?.id ?? null);
    setViewerProfile(profile);
    setSavedIds(user ? await listSavedPostIds() : []);
    if (source === "supabase") await loadFeed();
  }

  const headings: Record<AppView, { title: string; subtitle: string }> = {
    feed: {
      title: "Community feed",
      subtitle: "Neighborhood reports from the community",
    },
    nearby: {
      title: "Nearby",
      subtitle:
        location === "all"
          ? "Reports closest to the downtown core"
          : `Reports tagged in ${location}`,
    },
    map: {
      title: "Neighborhoods",
      subtitle: "Open reports by district",
    },
    saved: {
      title: "Saved",
      subtitle: "Issues you are following",
    },
    profile: {
      title: "Profile",
      subtitle: "Your local reporting activity",
    },
  };

  const showFilters = view !== "profile" && view !== "map";

  return (
    <div className="min-h-full bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r bg-sidebar transition-[width] duration-200 ease-in-out lg:block",
          sidebarCollapsed ? "w-[4.5rem]" : "w-64"
        )}
      >
            <AppSidebar
          view={view}
          onViewChange={setView}
              location={location}
              locationOptions={locationOptions}
          onLocationChange={setLocation}
          openCount={openCount}
          savedCount={savedIds.length}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <AppSidebar
            view={view}
            onViewChange={(next) => {
              setView(next);
              setMobileNavOpen(false);
            }}
            location={location}
            locationOptions={locationOptions}
            onLocationChange={setLocation}
            openCount={openCount}
            savedCount={savedIds.length}
          />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "transition-[padding] duration-200 ease-in-out",
          sidebarCollapsed ? "lg:pl-[4.5rem]" : "lg:pl-64"
        )}
      >
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md">
          <div className="flex flex-col gap-3 px-4 py-3 md:px-6 xl:px-10">
            <div className="flex items-center gap-2 lg:gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
                onClick={() => setMobileNavOpen(true)}
              >
                <MenuIcon />
              </Button>
              <div className="min-w-0 flex-1 lg:w-56 lg:flex-none xl:w-64">
                <div className="flex items-center gap-2 lg:hidden">
                  <CompassIcon className="size-4 shrink-0" />
                  <span className="truncate text-sm font-semibold">Local Intel</span>
                </div>
                <h1 className="hidden text-lg font-semibold tracking-tight lg:block">
                  {headings[view].title}
                </h1>
                <p className="hidden truncate text-sm text-muted-foreground lg:block">
                  {headings[view].subtitle}
                </p>
              </div>

              {showFilters ? (
                <div className="relative hidden min-w-0 flex-1 lg:block">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search issues, streets, or landmarks"
                    className="h-9 pl-8"
                    aria-label="Search issues"
                  />
                </div>
              ) : (
                <div className="hidden flex-1 lg:block" />
              )}

              <div className="ml-auto flex shrink-0 items-center gap-2">
                <ThemeToggle />
                <AccountDialog onSessionChange={handleSessionChange} />
                <Button
                  type="button"
                  size="sm"
                  className="lg:h-8"
                  onClick={() => setReportOpen(true)}
                >
                  <PlusIcon data-icon="inline-start" />
                  <span className="lg:hidden">Report</span>
                  <span className="hidden lg:inline">Report an Issue</span>
                </Button>
              </div>
            </div>

            <div className="lg:hidden">
              <h1 className="text-base font-semibold tracking-tight">
                {headings[view].title}
              </h1>
              <p className="text-sm text-muted-foreground">{headings[view].subtitle}</p>
            </div>

            {showFilters ? (
              <div className="relative min-w-0 lg:hidden">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search issues, streets, or landmarks"
                  className="h-9 pl-8"
                  aria-label="Search issues"
                />
              </div>
            ) : null}

            {showFilters ? (
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <CategoryFilters value={category} onValueChange={setCategory} />
                </div>
                <LocationSelector
                  value={location}
                  options={locationOptions}
                  onValueChange={setLocation}
                  className="w-full md:w-56 lg:hidden"
                />
              </div>
            ) : null}
          </div>
        </header>

        <main className="px-3 py-4 pb-24 md:px-6 md:pb-10 xl:px-8">
          {feedError ? (
            <div className="mx-auto mb-4 flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm" role="alert">
              <span>Could not load community posts: {feedError}</span>
              <Button type="button" size="sm" variant="outline" onClick={() => void loadFeed()} disabled={loading}>Retry</Button>
            </div>
          ) : null}
          {view === "map" ? (
            <NeighborhoodBoard
              issues={issues}
              selected={location}
              onSelect={(next) => {
                setLocation(next);
                setView("feed");
              }}
            />
          ) : null}

          {view === "profile" ? (
            <ProfilePanel issues={issues} savedCount={savedIds.length} profile={viewerProfile} />
          ) : null}

          {view !== "map" && view !== "profile" ? (
            <IssueList
              issues={filtered}
              savedIds={savedIds}
              onToggleSave={toggleSave}
              onUpvote={upvote}
              onAddComment={addComment}
              viewerId={viewerId}
              analyzingPostId={analyzingPostId}
              onAnalyze={analyzePost}
              loading={loading}
              emptyLabel={
                view === "saved"
                  ? "No saved issues match these filters."
                  : "No issues match these filters."
              }
            />
          ) : null}
        </main>
      </div>

      <MobileNav
        view={view}
        onViewChange={setView}
        onReport={() => setReportOpen(true)}
      />
      <ReportIssueDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        defaultNeighborhood={location}
        onSubmit={addIssue}
      />
    </div>
  );
}

function IssueList({
  issues,
  savedIds,
  onToggleSave,
  onUpvote,
  onAddComment,
  viewerId,
  analyzingPostId,
  onAnalyze,
  loading,
  emptyLabel,
}: {
  issues: Issue[];
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onUpvote: (id: string) => void;
  onAddComment: (postId: string, body: string, parentId: string | null) => void;
  viewerId: string | null;
  analyzingPostId: string | null;
  onAnalyze: (postId: string) => void;
  loading: boolean;
  emptyLabel: string;
}) {
  if (loading && issues.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1100px] rounded-lg border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
        Loading community reports…
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1100px] rounded-lg border border-dashed px-6 py-16 text-center">
        <p className="text-sm font-medium">{emptyLabel}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try another neighborhood, category, or search term.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      {issues.map((issue) => (
        <PostItem
          key={issue.id}
          post={issue}
          saved={savedIds.includes(issue.id)}
          onToggleSave={onToggleSave}
          onUpvote={onUpvote}
          onAddComment={onAddComment}
          canAnalyze={viewerId === issue.authorId}
          analyzing={analyzingPostId === issue.id}
          onAnalyze={onAnalyze}
        />
      ))}
    </div>
  );
}

function NeighborhoodBoard({
  issues,
  selected,
  onSelect,
}: {
  issues: Issue[];
  selected: string | "all";
  onSelect: (value: string | "all") => void;
}) {
  return (
    <div className="mx-auto grid w-full max-w-[1100px] gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card
        role="button"
        tabIndex={0}
        className={cn(
          "cursor-pointer shadow-none ring-border",
          selected === "all" && "ring-2 ring-foreground"
        )}
        onClick={() => onSelect("all")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect("all");
          }
        }}
      >
        <CardHeader>
          <CardTitle>All neighborhoods</CardTitle>
          <CardDescription>{issues.length} reports</CardDescription>
        </CardHeader>
      </Card>
      {[...new Set(issues.map((issue) => issue.neighborhood).filter(Boolean))].sort((a, b) => a.localeCompare(b)).map((neighborhood) => {
        const count = issues.filter(
          (issue) => issue.neighborhood === neighborhood
        ).length;

        return (
          <Card
            key={neighborhood}
            role="button"
            tabIndex={0}
            className={cn(
              "cursor-pointer shadow-none ring-border",
              selected === neighborhood && "ring-2 ring-foreground"
            )}
            onClick={() => onSelect(neighborhood)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(neighborhood);
              }
            }}
          >
            <CardHeader>
              <CardTitle>{neighborhood}</CardTitle>
              <CardDescription>
                {count} {count === 1 ? "report" : "reports"}
              </CardDescription>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}

function ProfilePanel({
  issues,
  savedCount,
  profile,
}: {
  issues: Issue[];
  savedCount: number;
  profile: AccountProfile | null;
}) {
  const reported = profile ? issues.filter((issue) => issue.reporter.name === profile.display_name) : [];

  return (
    <div className="mx-auto grid w-full max-w-[1100px] gap-4">
      <Card className="shadow-none ring-border">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
              <AvatarFallback>
                <UserRoundIcon className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{profile?.display_name ?? "Sign in to view your profile"}</CardTitle>
              <CardDescription>{profile ? `${profile.account_type === "student" ? "Student" : "Working Professional"} · ${profile.city ?? "City not set"} · ${profile.neighborhood ?? "Neighborhood not set"}` : "Use the account button to sign in or create an account."}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          <Stat label="Reported" value={reported.length} />
          <Stat label="Saved" value={savedCount} />
          <Stat label="Citywide" value={issues.length} />
        </CardContent>
      </Card>
      {reported.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
          {profile ? "You have not reported an issue yet. Use the account button to edit your profile." : "Sign in to create, save, vote on, and comment on reports."}
        </div>
      ) : (
        reported.map((issue) => (
          <Card key={issue.id} className="shadow-none ring-border">
            <CardHeader>
              <CardTitle>{issue.title}</CardTitle>
              <CardDescription>
                {issue.neighborhood} · {issue.status}
              </CardDescription>
            </CardHeader>
          </Card>
        ))
      )}
    </div>
  );
}

function isWithinRadius(
  originLat: number | null | undefined,
  originLng: number | null | undefined,
  targetLat: number | null | undefined,
  targetLng: number | null | undefined,
  radiusKm: number
) {
  if (typeof originLat !== "number" || typeof originLng !== "number" || typeof targetLat !== "number" || typeof targetLng !== "number") return false;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(targetLat - originLat);
  const dLng = radians(targetLng - originLng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(originLat)) * Math.cos(radians(targetLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= radiusKm;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/40 px-3 py-3">
      <p className="text-lg font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
