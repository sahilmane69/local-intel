import { Suspense } from "react";

import { CommunityFeed } from "@/components/feed/community-feed";
import { listPosts } from "@/repositories/server-posts";

export default async function Home() {
  const initialFeed = await listPosts();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center text-sm text-muted-foreground">
          Loading Local Intel…
        </div>
      }
    >
      <CommunityFeed initialFeed={initialFeed} />
    </Suspense>
  );
}
