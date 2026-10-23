export type ReverseGeocodedLocation = { address: string | null; city: string | null; neighborhood: string | null };

export async function reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodedLocation> {
  const response = await fetch("/api/geocode/reverse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude, longitude }),
  });
  const result = await response.json().catch(() => null) as (ReverseGeocodedLocation & { error?: string }) | null;
  if (!response.ok) throw new Error(result?.error ?? "Reverse geocoding failed.");
  return { address: result?.address ?? null, city: result?.city ?? null, neighborhood: result?.neighborhood ?? null };
}
