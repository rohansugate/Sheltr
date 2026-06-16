import { rehydrateLikedListings } from "../rehydrate-listings";
import type { Listing } from "../types";

/** Resolve saved listing IDs into live catalog objects. */
export function resolveLikedFromIds(
  ids: string[],
  listings: Listing[],
): Listing[] {
  const stubs = ids.map((id) => ({ id }) as Listing);
  return rehydrateLikedListings(stubs, listings);
}

export function syncLikedState(
  ids: string[],
  listings: Listing[],
): { likedListingIds: string[]; likedListings: Listing[] } {
  const likedListings = resolveLikedFromIds(ids, listings);
  const likedListingIds = likedListings.map((l) => l.id);
  return { likedListingIds, likedListings };
}
