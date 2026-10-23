export const categories = ["roads", "utilities", "safety", "environment", "transit", "parks"] as const;
export const statuses = ["open", "in-progress", "resolved"] as const;
export const verificationStatuses = ["unverified", "community-corroborated", "officially-confirmed"] as const;

export type Category = (typeof categories)[number];
export type Status = (typeof statuses)[number];
export type Neighborhood = string;
export type VerificationStatus = (typeof verificationStatuses)[number];
export type MediaKind = "image" | "video" | "audio";
export type EvidenceSourceKind = "photo" | "video" | "audio" | "link" | "source-post";

export type IssueAttachment = { id: string; kind: MediaKind; name: string; mimeType: string; url: string; caption?: string; poster?: string; file?: File };
export type IssueCoordinates = { lat: number; lng: number };
export type EvidenceSource = { id: string; kind: EvidenceSourceKind; label: string; href?: string; attachmentId?: string; note?: string; recordedAt?: string };
export type Verification = { status: VerificationStatus; notes: string; assessedAt: string; assessedBy: string; sources: EvidenceSource[] };
export type PostComment = { id: string; postId: string; parentId: string | null; body: string; createdAt: string; author: { name: string; initials: string } };
export type AiSource = { title: string; url: string; publishedAt?: string | null };
export type AiInsight = { summary: string; suggestedCategory?: Category | null; duplicateHints: string[]; evidenceNotes: string; generatedAt: string; checkedAt?: string | null; model: string; sources?: AiSource[] };
export type Issue = {
  id: string; authorId: string; title: string; description: string; category: Category; status: Status; city?: string | null; neighborhood: Neighborhood; address: string;
  upvotes: number; commentCount: number; reporter: { name: string; initials: string }; createdAt: string; tags?: string[];
  evidence?: string; coordinates?: IssueCoordinates | null; locationSource?: "gps" | "manual"; attachments?: IssueAttachment[];
  verification: Verification; comments?: PostComment[]; aiInsight?: AiInsight | null;
};

export const categoryLabels: Record<Category, string> = { roads: "Roads", utilities: "Utilities", safety: "Safety", environment: "Environment", transit: "Transit", parks: "Parks" };
export const statusLabels: Record<Status, string> = { open: "Open", "in-progress": "In Progress", resolved: "Resolved" };
export const verificationLabels: Record<VerificationStatus, string> = { unverified: "Unverified", "community-corroborated": "Community Corroborated", "officially-confirmed": "Officially Confirmed" };

export function unverifiedIntake(createdAt: string, sources: EvidenceSource[] = []): Verification {
  return { status: "unverified", notes: "Neighbor-submitted. This report has not been independently confirmed by city staff or a trusted publisher.", assessedAt: createdAt, assessedBy: "Local Intel intake", sources };
}
