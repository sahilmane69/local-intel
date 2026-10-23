import { Badge } from "@/components/ui/badge";
import {
  verificationLabels,
  type VerificationStatus,
} from "@/data/issues";

const variants: Record<VerificationStatus, "outline" | "secondary" | "default"> = {
  unverified: "outline",
  "community-corroborated": "secondary",
  "officially-confirmed": "default",
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return (
    <Badge variant={variants[status]} className="rounded-md px-2 font-medium">
      {verificationLabels[status]}
    </Badge>
  );
}
