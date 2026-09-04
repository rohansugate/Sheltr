import { NextResponse } from "next/server";
import {
  listActiveListings,
  listApplications,
  listConversations,
  listMessages,
  listShowings,
  upsertListingDocument,
} from "@/lib/appwrite/data";
import { getSessionUser } from "@/lib/auth-server";
import { mockListings } from "@/lib/mock-data";
import type { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [listings, showings, applications, conversations, messages] =
      await Promise.all([
        listActiveListings(100),
        listShowings(),
        listApplications(),
        listConversations(),
        listMessages(),
      ]);

    return NextResponse.json({
      listings,
      showings,
      applications,
      conversations,
      messages,
      storage: "appwrite",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bootstrap failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Seed Appwrite with curated LA Section 8 listings if empty. */
export async function POST() {
  try {
    const user = await getSessionUser();
    const existing = await listActiveListings(5);
    if (existing.length > 0) {
      return NextResponse.json({
        ok: true,
        seeded: 0,
        message: "Listings already present",
        count: existing.length,
      });
    }

    const landlordId = user?.id ?? "platform";
    let seeded = 0;
    for (const listing of mockListings.slice(0, 40)) {
      const payload: Listing = {
        ...listing,
        landlordId: listing.landlordId ?? landlordId,
        source: listing.source === "MANUAL" ? "IMPORTED" : listing.source,
        status: "ACTIVE",
      };
      await upsertListingDocument(payload);
      seeded += 1;
    }

    return NextResponse.json({ ok: true, seeded });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
