import type { Listing } from "./types";

/** Replace saved listing snapshots with fresh data from the canonical catalog. */
export function rehydrateLikedListings(
  likedListings: Listing[],
  listings: Listing[],
): Listing[] {
  const byId = new Map(listings.map((l) => [l.id, l]));
  return likedListings
    .map((saved) => byId.get(saved.id))
    .filter((l): l is Listing => l != null && l.status === "ACTIVE");
}
