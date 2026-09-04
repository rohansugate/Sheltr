import { NextResponse } from "next/server";
import {
  listActiveListings,
  listListingsByLandlord,
  upsertListingDocument,
} from "@/lib/appwrite/data";
import { getSessionUser } from "@/lib/auth-server";
import type { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const landlordId = searchParams.get("landlordId");
    const listings = landlordId
      ? await listListingsByLandlord(landlordId)
      : await listActiveListings(100);
    return NextResponse.json({ listings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load listings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "LANDLORD") {
      return NextResponse.json(
        { error: "Sign in as a landlord to publish listings." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { listing?: Listing };
    if (!body.listing) {
      return NextResponse.json({ error: "Missing listing" }, { status: 400 });
    }

    const listing: Listing = {
      ...body.listing,
      landlordId: user.id,
    };
    const saved = await upsertListingDocument(listing);
    return NextResponse.json({ listing: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save listing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
