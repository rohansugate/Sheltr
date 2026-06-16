import { filterListingsForSeeker, SEEKER_DECK_SIZE } from "../mock-data";
import { sortByRelevance } from "../sort-listings";
import type {
  DiscoverFilters,
  Listing,
  Match,
  SeekerConstraints,
} from "../types";
import { defaultConstraints } from "./defaults";

export function buildDeck(
  listings: Listing[],
  constraints: SeekerConstraints | null,
  likedListingIds: string[],
  likedListings: Listing[],
  matches: Match[],
  filters: DiscoverFilters,
) {
  const passedIds = new Set(
    matches.filter((m) => m.status === "PASSED").map((m) => m.listingId),
  );
  const likedIds = new Set(likedListingIds);
  const activeConstraints = constraints ?? defaultConstraints;
  let filtered = filterListingsForSeeker(listings, activeConstraints).filter(
    (l) => !passedIds.has(l.id) && !likedIds.has(l.id),
  );
  if (filters.maxRent < activeConstraints.maxRent) {
    filtered = filtered.filter((l) => l.monthlyRent <= filters.maxRent);
  }
  if (filters.groundFloorOnly) {
    filtered = filtered.filter((l) => l.isGroundFloor);
  }
  if (filters.neighborhood) {
    filtered = filtered.filter((l) => l.neighborhood === filters.neighborhood);
  }
  return sortByRelevance(filtered, activeConstraints, likedListings).slice(
    0,
    SEEKER_DECK_SIZE,
  );
}
