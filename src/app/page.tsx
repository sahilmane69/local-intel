import { Suspense } from "react";

import { CommunityFeed } from "@/components/feed/community-feed";
import { listPosts } from "@/repositories/server-posts";

async function Feed() {
  const initialFeed = await listPosts();

  return <CommunityFeed initialFeed={initialFeed} />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center text-sm text-muted-foreground">
          Loading Local Intel…
        </div>
      }
    >
      <Feed />
    </Suspense>
  );
}
