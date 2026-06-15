import { parseAffordableHousingHtml } from "./affordable-housing-parser";
import { fetchDirect, fetchWithUnlocker } from "./fetch-unlocker";
import { DEFAULT_IMAGE, zipToCoords, distanceMilesBetween } from "./geo";
import { mockListings } from "./mock-data";
import type { Listing } from "./types";
import { parseZillowHtml } from "./zillow-parser";
import {
  affordableHousingMetroUrl,
  affordableHousingUrl,
  isLosAngelesZip,
  isValidUsZip,
  zillowRentalsUrl,
} from "./zip-search";

export type ListingSearchParams = {
  zipCode: string;
  maxRent?: number;
  minBedrooms?: number;
  maxResults?: number;
};

export type ListingSearchResult = {
  listings: Listing[];
  sources: {
    affordableHousing: number;
    zillow: number;
    zillowConfigured: boolean;
  };
  zipCode: string;
  fetchedAt: string;
};

function jitterCoords(zipCode: string, index: number) {
  const base = zipToCoords(zipCode);
  const angle = index * 2.399963;
  return {
    latitude: base.latitude + Math.sin(angle) * 0.012,
    longitude: base.longitude + Math.cos(angle) * 0.015,
  };
}

function ahToListing(
  raw: ReturnType<typeof parseAffordableHousingHtml>[number],
  index: number,
): Listing {
  const coords = jitterCoords(raw.zipCode, index);
  return {
    id: raw.id,
    landlordId: "landlord-1",
    title: raw.title,
    monthlyRent: raw.monthlyRent,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    images: raw.imageUrl ? [raw.imageUrl] : [DEFAULT_IMAGE],
    isSection8Approved: raw.isSection8Approved,
    isGroundFloor: false,
    zipCode: raw.zipCode,
    neighborhood: raw.address.split(",")[1]?.trim(),
    transitLines: ["LA Metro", "Bus Line"],
    landlordVerified: raw.landlordVerified,
    latitude: coords.latitude,
    longitude: coords.longitude,
    source: "IMPORTED",
    status: "ACTIVE",
    analytics: { views: 0, saves: 0, applications: 0 },
    utilitiesIncluded: "Ask landlord",
    availableDate: new Date().toISOString().slice(0, 10),
  };
}

function zillowToListing(
  raw: ReturnType<typeof parseZillowHtml>[number],
  index: number,
): Listing {
  const coords =
    raw.latitude && raw.longitude
      ? { latitude: raw.latitude, longitude: raw.longitude }
      : jitterCoords(raw.zipCode, index + 50);
  return {
    id: raw.id,
    title: raw.title,
    monthlyRent: raw.monthlyRent,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    images: raw.imageUrl ? [raw.imageUrl] : [DEFAULT_IMAGE],
    isSection8Approved: false,
    isGroundFloor: false,
    zipCode: raw.zipCode,
    neighborhood: raw.address.split(",")[1]?.trim(),
    transitLines: ["LA Metro", "Bus Line"],
    landlordVerified: false,
    latitude: coords.latitude,
    longitude: coords.longitude,
    source: "ZILLOW",
    status: "ACTIVE",
    analytics: { views: 0, saves: 0, applications: 0 },
    utilitiesIncluded: "See Zillow listing",
    petsAllowed: undefined,
  };
}

function filterByConstraints(
  listings: Listing[],
  params: ListingSearchParams,
  seekerZip: string,
): Listing[] {
  let filtered = listings;

  if (params.maxRent) {
    filtered = filtered.filter((l) => l.monthlyRent <= params.maxRent!);
  }
  if (params.minBedrooms) {
    filtered = filtered.filter((l) => l.bedrooms >= params.minBedrooms!);
  }

  const seekerCoords = zipToCoords(seekerZip);
  return filtered
    .map((l) => ({
      listing: l,
      miles: distanceMilesBetween(seekerCoords, l),
    }))
    .sort((a, b) => {
      if (a.listing.isSection8Approved !== b.listing.isSection8Approved) {
        return a.listing.isSection8Approved ? -1 : 1;
      }
      return a.miles - b.miles || a.listing.monthlyRent - b.listing.monthlyRent;
    })
    .map((x) => x.listing);
}

export async function searchListingsByZip(
  params: ListingSearchParams,
): Promise<ListingSearchResult> {
  const zipCode = params.zipCode;
  if (!isValidUsZip(zipCode)) {
    throw new Error("Invalid zip code");
  }

  const maxResults = params.maxResults ?? 40;

  // 1) Section 8 — Affordable Housing.com (direct fetch works)
  let ahHtml = await fetchDirect(affordableHousingUrl(zipCode));
  let ahParsed = ahHtml ? parseAffordableHousingHtml(ahHtml, zipCode) : [];

  if (ahParsed.length < 5 && isLosAngelesZip(zipCode)) {
    const metroHtml = await fetchDirect(affordableHousingMetroUrl());
    if (metroHtml) {
      const metroParsed = parseAffordableHousingHtml(metroHtml, zipCode);
      const seekerCoords = zipToCoords(zipCode);
      ahParsed = metroParsed
        .map((l) => {
          const coords = zipToCoords(l.zipCode);
          return {
            ...l,
            _miles: distanceMilesBetween(seekerCoords, coords),
          };
        })
        .filter((l) => l._miles <= 15)
        .sort((a, b) => a._miles - b._miles)
        .map(({ _miles: _, ...rest }) => rest);
    }
  }

  const ahListings = ahParsed.map(ahToListing);

  // 2) Zillow rentals — requires Bright Data Web Unlocker
  const zillowConfigured = Boolean(process.env.BRIGHT_DATA_API_TOKEN);
  let zillowListings: Listing[] = [];
  if (zillowConfigured) {
    const zillowHtml =
      (await fetchWithUnlocker(zillowRentalsUrl(zipCode))) ??
      (await fetchDirect(zillowRentalsUrl(zipCode)));
    if (zillowHtml) {
      const parsed = parseZillowHtml(zillowHtml, zipCode);
      zillowListings = parsed.map(zillowToListing);
    }
  }

  // Dedupe by normalized address; prefer Section 8 (AH) over Zillow
  const seen = new Set<string>();
  const merged: Listing[] = [];

  for (const listing of [...ahListings, ...zillowListings]) {
    const key = listing.title.toLowerCase().replace(/\s+/g, " ").slice(0, 40);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(listing);
  }

  let listings = filterByConstraints(merged, params, zipCode).slice(0, maxResults);

  if (listings.length === 0) {
    listings = filterByConstraints(mockListings, params, zipCode).slice(0, maxResults);
  }

  return {
    listings,
    sources: {
      affordableHousing: ahListings.length,
      zillow: zillowListings.length,
      zillowConfigured,
    },
    zipCode,
    fetchedAt: new Date().toISOString(),
  };
}
