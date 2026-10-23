"use client";

import { useMemo, useState } from "react";
import { CompassIcon, MenuIcon, PlusIcon, SearchIcon, UserRoundIcon } from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  neighborhoods,
  type Category,
  type Issue,
  type Neighborhood,
} from "@/data/issues";
import { enrichNewPost, getMockPosts } from "@/repositories/posts";

import { AppSidebar } from "./app-sidebar";
import { CategoryFilters } from "./category-filters";
import { LocationSelector } from "./location-selector";
import { MobileNav } from "./mobile-nav";
import { PostItem } from "./post-item";
import { ReportIssueDialog } from "./report-issue-dialog";
import type { AppView } from "./types";
import { useSidebarCollapsed } from "./use-sidebar-collapsed";

export function CommunityFeed() {
  const [issues, setIssues] = useState<Issue[]>(() => getMockPosts());
  const [savedIds, setSavedIds] = useState<string[]>(["iss-102", "iss-104"]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [location, setLocation] = useState<Neighborhood | "all">("all");
  const [view, setView] = useState<AppView>("feed");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarCollapsed();

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
        const matchesNearby =
          view !== "nearby" ||
          (location === "all"
            ? ["Downtown", "Midtown", "Harbor East"].includes(issue.neighborhood)
            : issue.neighborhood === location);

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
  }, [category, issues, location, query, savedIds, view]);

  const openCount = issues.filter((issue) => {
    const inLocation = location === "all" || issue.neighborhood === location;
    return inLocation && issue.status !== "resolved";
  }).length;

  function toggleSave(id: string) {
    setSavedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function upvote(id: string) {
    setIssues((current) =>
      current.map((issue) =>
        issue.id === id ? { ...issue, upvotes: issue.upvotes + 1 } : issue
      )
    );
  }

  function addComment(postId: string, body: string, parentId: string | null) {
    setIssues((current) =>
      current.map((issue) => {
        if (issue.id !== postId) return issue;
        const comments = [
          ...(issue.comments ?? []),
          {
            id: `c-${crypto.randomUUID()}`,
            postId,
            parentId,
            body,
            createdAt: new Date().toISOString(),
            author: { name: "Alex Chen", initials: "AC" },
          },
        ];
        return { ...issue, comments, commentCount: comments.length };
      })
    );
  }

  async function addIssue(issue: Issue) {
    const next = await enrichNewPost(issue);
    setIssues((current) => [next, ...current]);
    setView("feed");
    setCategory("all");
    setQuery("");
    toast.message("Using local mock data. Supabase is not connected.");
  }

  const headings: Record<AppView, { title: string; subtitle: string }> = {
    feed: {
      title: "Community feed",
      subtitle: "Neighborhood reports in Fairview",
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
                  onValueChange={setLocation}
                  className="w-full md:w-56 lg:hidden"
                />
              </div>
            ) : null}
          </div>
        </header>

        <main className="px-3 py-4 pb-24 md:px-6 md:pb-10 xl:px-8">
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
            <ProfilePanel issues={issues} savedCount={savedIds.length} />
          ) : null}

          {view !== "map" && view !== "profile" ? (
            <IssueList
              issues={filtered}
              savedIds={savedIds}
              onToggleSave={toggleSave}
              onUpvote={upvote}
              onAddComment={addComment}
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
  emptyLabel,
}: {
  issues: Issue[];
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onUpvote: (id: string) => void;
  onAddComment: (postId: string, body: string, parentId: string | null) => void;
  emptyLabel: string;
}) {
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
  selected: Neighborhood | "all";
  onSelect: (value: Neighborhood | "all") => void;
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
          <CardTitle>All Fairview</CardTitle>
          <CardDescription>{issues.length} reports citywide</CardDescription>
        </CardHeader>
      </Card>
      {neighborhoods.map((neighborhood) => {
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
}: {
  issues: Issue[];
  savedCount: number;
}) {
  const reported = issues.filter((issue) => issue.reporter.name === "Alex Chen");

  return (
    <div className="mx-auto grid w-full max-w-[1100px] gap-4">
      <Card className="shadow-none ring-border">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback>
                <UserRoundIcon className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Alex Chen</CardTitle>
              <CardDescription>Midtown · reporting since 2024</CardDescription>
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
          You have not reported an issue yet. Use Report an Issue to add one locally.
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/40 px-3 py-3">
      <p className="text-lg font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
