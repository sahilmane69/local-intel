import { Badge } from "@/components/ui/badge";
import { statusLabels, type Status } from "@/data/issues";

const variants: Record<Status, "outline" | "secondary" | "default"> = {
  open: "outline",
  "in-progress": "secondary",
  resolved: "default",
};

export function StatusBadge({ status }: { status: Status }) {
  return <Badge variant={variants[status]}>{statusLabels[status]}</Badge>;
}
