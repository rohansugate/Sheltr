import { NextResponse } from "next/server";
import {
  listActiveListings,
  listDomainForUser,
  listListingsByLandlord,
  upsertListingDocument,
} from "@/lib/appwrite/data";
import { mockListings } from "@/lib/mock-data";
import { getSessionActor } from "@/lib/server/actor";
import type { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Public listings, plus the signed-in user's own records. */
export async function GET() {
  try {
    const actor = await getSessionActor();
    const [active, own, domain] = await Promise.all([
      listActiveListings(100),
      actor?.role === "LANDLORD" ? listListingsByLandlord(actor.id) : Promise.resolve([]),
      actor ? listDomainForUser(actor) : Promise.resolve(null),
    ]);
    const listings = [...own, ...active.filter((l) => !own.some((o) => o.id === l.id))];

    return NextResponse.json({
      listings,
      showings: domain?.showings ?? [],
      applications: domain?.applications ?? [],
      conversations: domain?.conversations ?? [],
      messages: domain?.messages ?? [],
      notifications: domain?.notifications ?? [],
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
    const existing = await listActiveListings(5);
    if (existing.length > 0) {
      return NextResponse.json({
        ok: true,
        seeded: 0,
        message: "Listings already present",
        count: existing.length,
      });
    }

    let seeded = 0;
    for (const listing of mockListings.slice(0, 40)) {
      const payload: Listing = {
        ...listing,
        landlordId: listing.landlordId ?? "platform",
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
