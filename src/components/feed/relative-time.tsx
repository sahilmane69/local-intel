"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";

export function RelativeTime({ iso }: { iso: string }) {
  const fallback = format(new Date(iso), "MMM d");
  const [label, setLabel] = useState(fallback);

  useEffect(() => {
    setLabel(formatDistanceToNow(new Date(iso), { addSuffix: true }));
  }, [iso]);

  return <span>{label}</span>;
}
