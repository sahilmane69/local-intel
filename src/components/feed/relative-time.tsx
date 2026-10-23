import { formatDistanceToNow } from "date-fns";

export function RelativeTime({ iso }: { iso: string }) {
  return (
    <span>{formatDistanceToNow(new Date(iso), { addSuffix: true })}</span>
  );
}
