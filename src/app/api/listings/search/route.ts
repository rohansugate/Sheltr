import { NextResponse } from "next/server";
import { searchListingsByZip } from "@/lib/listing-search";
import { isValidUsZip } from "@/lib/zip-search";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get("zip") ?? "";
  const maxRent = Number(searchParams.get("maxRent") ?? "0") || undefined;
  const minBedrooms = Number(searchParams.get("bedrooms") ?? "0") || undefined;

  if (!isValidUsZip(zipCode)) {
    return NextResponse.json({ error: "Valid 5-digit US zip required" }, { status: 400 });
  }

  try {
    const result = await searchListingsByZip({
      zipCode,
      maxRent,
      minBedrooms,
      maxResults: 40,
    });

    if (result.listings.length === 0) {
      return NextResponse.json({
        ...result,
        message:
          "No listings found for this zip. Try a nearby LA zip or add BRIGHT_DATA_API_TOKEN for Zillow search.",
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
