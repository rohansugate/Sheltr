import type { ListingSearchResult } from "../listing-search";
import { isBuiltInSeedListing } from "../sort-listings";
import type { Listing, Locale, SeekerConstraints } from "../types";
import { t } from "../i18n";
import { buildDeck } from "./deck";
import { buildListingFetchKey, defaultConstraints } from "./defaults";
import { syncLikedState } from "./liked";

type StoreSlice = {
  constraints: SeekerConstraints | null;
  likedListingIds: string[];
  likedListings: Listing[];
  listings: Listing[];
  matches: import("../types").Match[];
  discoverFilters: import("../types").DiscoverFilters;
  listingsFetchKey: string | null;
};

type SetFn = (partial: Record<string, unknown>) => void;
type GetFn = () => StoreSlice & {
  showUiFeedback: (message: string, type: "error" | "success") => void;
  refreshDeck: () => void;
};

export async function runFetchListingsByZip(
  get: GetFn,
  set: SetFn,
  locale: Locale = "en",
) {
  const state = get();
  const activeConstraints = state.constraints ?? defaultConstraints;
  const zip = activeConstraints.zipCode;
  if (!zip || zip.length !== 5) return;

  const fetchKey = buildListingFetchKey(activeConstraints);
  set({ listingsFetchStatus: "loading" });

  try {
    const params = new URLSearchParams({
      zip,
      maxRent: String(activeConstraints.maxRent),
      bedrooms: String(activeConstraints.voucherSize),
    });
    const res = await fetch(`/api/listings/search?${params}`);
    const data = (await res.json()) as ListingSearchResult & {
      error?: string;
      message?: string;
    };

    if (!res.ok || !data.listings) {
      throw new Error(data.error ?? data.message ?? "Listing search failed");
    }

    const landlordOwned = state.listings.filter(
      (l) => l.source === "MANUAL" && !isBuiltInSeedListing(l.id),
    );
    const updatedListings = [...data.listings, ...landlordOwned];
    const freshLiked = syncLikedState(
      state.likedListingIds,
      updatedListings,
    );

    set({
      listings: updatedListings,
      ...freshLiked,
      listingsFetchStatus: "ready",
      listingsSourceZip: zip,
      listingsFetchKey: fetchKey,
      listingsFetchedAt: data.fetchedAt,
      listingsMeta: data.sources ?? null,
      listingsCoverage: data.coverage ?? null,
      listingsCoverageMessage: data.coverageMessage ?? null,
      deck: buildDeck(
        updatedListings,
        activeConstraints,
        freshLiked.likedListingIds,
        freshLiked.likedListings,
        state.matches,
        state.discoverFilters,
      ),
    });
  } catch (err) {
    set({ listingsFetchStatus: "error" });
    get().showUiFeedback(
      err instanceof Error ? err.message : t(locale, "listingSearchFailed"),
      "error",
    );
    get().refreshDeck();
  }
}

export function applyListingsUpdate(
  get: GetFn,
  set: SetFn,
  updatedListings: Listing[],
) {
  const state = get();
  const freshLiked = syncLikedState(state.likedListingIds, updatedListings);
  const activeConstraints = state.constraints ?? defaultConstraints;
  set({
    listings: updatedListings,
    ...freshLiked,
    deck: buildDeck(
      updatedListings,
      activeConstraints,
      freshLiked.likedListingIds,
      freshLiked.likedListings,
      state.matches,
      state.discoverFilters,
    ),
  });
}

export function applyLikedIds(
  get: GetFn,
  set: SetFn,
  ids: string[],
) {
  const { listings } = get();
  set(syncLikedState(ids, listings));
}
