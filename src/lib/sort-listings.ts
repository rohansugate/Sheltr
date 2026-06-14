import type { Listing, SeekerConstraints } from "./types";

export function scoreListing(
  listing: Listing,
  constraints: SeekerConstraints,
  likedListings: Listing[],
): number {
  let score = 0;

  if (listing.bedrooms === constraints.voucherSize) score += 30;
  else if (listing.bedrooms > constraints.voucherSize) score += 15;

  const rentRatio = listing.monthlyRent / constraints.maxRent;
  if (rentRatio <= 0.85) score += 25;
  else if (rentRatio <= 1) score += 15;

  if (constraints.accessibilityNeeds && listing.isGroundFloor) score += 20;

  const transitOverlap = listing.transitLines.filter((t) =>
    constraints.proximityNeeds.some(
      (need) =>
        t.toLowerCase().includes(need.toLowerCase()) ||
        need.toLowerCase().includes(t.toLowerCase()),
    ),
  ).length;
  score += transitOverlap * 15;

  const likedZips = new Set(likedListings.map((l) => l.zipCode));
  if (likedZips.has(listing.zipCode)) score += 20;

  const likedNeighborhoods = new Set(
    likedListings.map((l) => l.neighborhood).filter(Boolean),
  );
  if (listing.neighborhood && likedNeighborhoods.has(listing.neighborhood))
    score += 10;

  if (listing.landlordVerified) score += 5;

  return score;
}

export function sortByRelevance(
  listings: Listing[],
  constraints: SeekerConstraints,
  likedListings: Listing[],
): Listing[] {
  return [...listings].sort((a, b) => {
    const diff =
      scoreListing(b, constraints, likedListings) -
      scoreListing(a, constraints, likedListings);
    return diff !== 0 ? diff : a.monthlyRent - b.monthlyRent;
  });
}

/** Built-in demo listings (listing-1 … listing-30) — not landlord-owned. */
export function isBuiltInSeedListing(id: string) {
  return /^listing-([1-9]|[1-2]\d|30)$/.test(id);
}

/** Block only when this landlord already has an active/draft listing with the same title. */
export function isDuplicateListing(
  existing: Listing[],
  candidate: {
    landlordId?: string;
    title: string;
    zipCode: string;
    monthlyRent: number;
    bedrooms: number;
  },
  excludeId?: string,
): boolean {
  const landlordId = candidate.landlordId;
  if (!landlordId) return false;

  const normalizedTitle = candidate.title.trim().toLowerCase();
  if (!normalizedTitle) return false;

  return existing.some(
    (l) =>
      l.id !== excludeId &&
      l.status !== "INACTIVE" &&
      !isBuiltInSeedListing(l.id) &&
      l.landlordId === landlordId &&
      l.title.trim().toLowerCase() === normalizedTitle,
  );
}
