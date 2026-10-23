import { Suspense } from "react";

import { CommunityFeed } from "@/components/feed/community-feed";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center text-sm text-muted-foreground">
          Loading Local Intel…
        </div>
      }
    >
      <CommunityFeed />
    </Suspense>
  );
}
