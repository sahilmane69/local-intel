export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

const allowedMediaTypes = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm",
  "audio/mpeg", "audio/webm", "audio/mp4", "audio/wav", "audio/ogg",
]);

export function isSafeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validateMediaFile(file: { name: string; type: string; size: number }) {
  if (!allowedMediaTypes.has(file.type)) return "Choose a supported image, video, or audio file.";
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_MEDIA_BYTES) return "Each attachment must be greater than 0 bytes and no larger than 50 MB.";
  if (!file.name.trim()) return "Each attachment needs a file name.";
  return null;
}

export function validateReportFields(input: { title: string; description: string; city?: string | null; neighborhood: string; address: string; tags: string[] }) {
  if (!input.title.trim()) return "A title is required.";
  if (input.title.trim().length > 160) return "Titles must be 160 characters or fewer.";
  if (!input.description.trim()) return "A description is required.";
  if (input.description.trim().length > 4_000) return "Descriptions must be 4,000 characters or fewer.";
  if (input.city && input.city.trim().length > 120) return "Cities must be 120 characters or fewer.";
  if (!input.neighborhood.trim() || input.neighborhood.trim().length > 120) return "A neighborhood of 1 to 120 characters is required.";
  if (input.address.trim().length > 500) return "Addresses must be 500 characters or fewer.";
  if (input.tags.length > 8 || input.tags.some((tag) => !tag.trim() || tag.length > 80)) return "Use up to 8 tags of 80 characters or fewer.";
  return null;
}
