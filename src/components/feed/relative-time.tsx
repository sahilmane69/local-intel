"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";

export function RelativeTime({ iso }: { iso: string }) {
  const [relativeTime, setRelativeTime] = useState<string | null>(null);

  useEffect(() => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return;

    const update = () => {
      setRelativeTime(formatDistanceToNowStrict(date, { addSuffix: true }));
    };
    const initialUpdate = window.setTimeout(update, 0);
    const interval = window.setInterval(update, 60_000);
    return () => {
      window.clearTimeout(initialUpdate);
      window.clearInterval(interval);
    };
  }, [iso]);

  return <time dateTime={iso}>{relativeTime ?? "Recently"}</time>;
}
