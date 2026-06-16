import { NextResponse } from "next/server";
import { searchListingsByZip } from "@/lib/listing-search";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  readSearchCache,
  searchCacheKey,
  writeSearchCache,
} from "@/lib/search-cache";
import { isValidUsZip } from "@/lib/zip-search";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit(`search:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many search requests. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get("zip") ?? "";
  const maxRent = Number(searchParams.get("maxRent") ?? "0") || undefined;
  const minBedrooms = Number(searchParams.get("bedrooms") ?? "0") || undefined;

  if (!isValidUsZip(zipCode)) {
    return NextResponse.json({ error: "Valid 5-digit US zip required" }, { status: 400 });
  }

  const cacheKey = searchCacheKey(zipCode, maxRent, minBedrooms);
  const cached = await readSearchCache(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  try {
    const result = await searchListingsByZip({
      zipCode,
      maxRent,
      minBedrooms,
      maxResults: 40,
    });

    await writeSearchCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
