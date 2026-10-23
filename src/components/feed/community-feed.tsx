"use client";

import { useMemo, useState } from "react";
import {
  CompassIcon,
  MenuIcon,
  PlusIcon,
  SearchIcon,
  UserRoundIcon,
} from "lucide-react";

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
import {
  mockIssues,
  neighborhoods,
  type Category,
  type Issue,
  type Neighborhood,
} from "@/data/issues";

import { AppSidebar } from "./app-sidebar";
import { CategoryFilters } from "./category-filters";
import { IssueCard } from "./issue-card";
import { LocationSelector } from "./location-selector";
import { MobileNav } from "./mobile-nav";
import { ReportIssueDialog } from "./report-issue-dialog";
import type { AppView } from "./types";

export function CommunityFeed() {
  const [issues, setIssues] = useState<Issue[]>(mockIssues);
  const [savedIds, setSavedIds] = useState<string[]>(["iss-102", "iss-104"]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [location, setLocation] = useState<Neighborhood | "all">("all");
  const [view, setView] = useState<AppView>("feed");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

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
          issue.address.toLowerCase().includes(needle);
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

  function addIssue(issue: Issue) {
    setIssues((current) => [issue, ...current]);
    setView("feed");
    setCategory("all");
    setQuery("");
  }

  const headings: Record<AppView, { title: string; subtitle: string }> = {
    feed: {
      title: "Community feed",
      subtitle: "Issues neighbors are tracking in Fairview.",
    },
    nearby: {
      title: "Nearby",
      subtitle:
        location === "all"
          ? "Open reports closest to the downtown core."
          : `Reports currently tagged in ${location}.`,
    },
    map: {
      title: "Neighborhoods",
      subtitle: "Jump into a district and scan its open reports.",
    },
    saved: {
      title: "Saved",
      subtitle: "Issues you want to follow.",
    },
    profile: {
      title: "Profile",
      subtitle: "Your local reporting activity.",
    },
  };

  return (
    <div className="min-h-full bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar lg:block">
        <AppSidebar
          view={view}
          onViewChange={setView}
          location={location}
          onLocationChange={setLocation}
          openCount={openCount}
          savedCount={savedIds.length}
        />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <AppSidebar
            view={view}
            onViewChange={(next) => {
              setView(next);
              setSidebarOpen(false);
            }}
            location={location}
            onLocationChange={setLocation}
            openCount={openCount}
            savedCount={savedIds.length}
          />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon />
            </Button>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <CompassIcon className="size-4 shrink-0" />
              <span className="truncate text-sm font-semibold">Local Intel</span>
            </div>
            <Button size="sm" onClick={() => setReportOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              Report
            </Button>
          </div>

          <div className="flex flex-col gap-4 px-4 py-4 md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                  {headings[view].title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {headings[view].subtitle}
                </p>
              </div>
              <Button
                className="hidden lg:inline-flex"
                size="lg"
                onClick={() => setReportOpen(true)}
              >
                <PlusIcon data-icon="inline-start" />
                Report an Issue
              </Button>
            </div>

            {view !== "profile" && view !== "map" ? (
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative min-w-0 flex-1">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search issues, streets, or landmarks"
                    className="pl-8"
                    aria-label="Search issues"
                  />
                </div>
                <LocationSelector
                  value={location}
                  onValueChange={setLocation}
                  className="w-full lg:hidden"
                />
              </div>
            ) : null}

            {view !== "profile" && view !== "map" ? (
              <CategoryFilters value={category} onValueChange={setCategory} />
            ) : null}
          </div>
        </header>

        <main className="px-4 py-6 pb-24 md:px-8 lg:pb-10">
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
  emptyLabel,
}: {
  issues: Issue[];
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onUpvote: (id: string) => void;
  emptyLabel: string;
}) {
  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-16 text-center">
        <p className="text-sm font-medium">{emptyLabel}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try another neighborhood, category, or search term.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          saved={savedIds.includes(issue.id)}
          onToggleSave={onToggleSave}
          onUpvote={onUpvote}
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
    <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card
        role="button"
        tabIndex={0}
        className={`cursor-pointer ${selected === "all" ? "ring-2 ring-foreground" : ""}`}
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
            className={`cursor-pointer ${
              selected === neighborhood ? "ring-2 ring-foreground" : ""
            }`}
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
    <div className="mx-auto grid max-w-3xl gap-4">
      <Card>
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
        <div className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
          You have not reported an issue yet. Use Report an Issue to add one locally.
        </div>
      ) : (
        reported.map((issue) => (
          <Card key={issue.id}>
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
    <div className="rounded-lg bg-secondary px-3 py-3">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
