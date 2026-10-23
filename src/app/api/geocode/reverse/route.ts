import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

let lastRequestAt = 0;

function asCoordinate(value: unknown, minimum: number, maximum: number) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
}

export async function POST(request: Request) {
  const client = await createServerSupabaseClient();
  const { data: auth } = client ? await client.auth.getUser() : { data: { user: null } };
  if (!auth.user) {
    return NextResponse.json({ error: "Sign in before using reverse geocoding." }, { status: 401 });
  }
  const userAgent = process.env.NOMINATIM_USER_AGENT?.trim();
  if (!userAgent) {
    return NextResponse.json({ error: "Reverse geocoding is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const latitude = asCoordinate(body?.latitude, -90, 90);
  const longitude = asCoordinate(body?.longitude, -180, 180);
  if (latitude === null || longitude === null) {
    return NextResponse.json({ error: "A valid latitude and longitude are required." }, { status: 400 });
  }

  const delay = Math.max(0, 1_000 - (Date.now() - lastRequestAt));
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  lastRequestAt = Date.now();

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`, {
      headers: { Accept: "application/json", "User-Agent": userAgent },
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Reverse geocoding is temporarily unavailable." }, { status: response.status === 429 ? 429 : 502 });
    }
    const result = await response.json() as { display_name?: unknown; address?: Record<string, unknown> };
    const address = result.address ?? {};
    const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
    return NextResponse.json({
      address: text(result.display_name),
      city: text(address.city) ?? text(address.town) ?? text(address.village) ?? text(address.municipality),
      neighborhood: text(address.neighbourhood) ?? text(address.suburb) ?? text(address.city_district) ?? text(address.quarter),
    });
  } catch {
    return NextResponse.json({ error: "Reverse geocoding could not be reached." }, { status: 502 });
  }
}
