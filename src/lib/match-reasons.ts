import type { Listing, SeekerConstraints } from "./types";
import { scoreListing } from "./sort-listings";

export function getMatchReasons(
  listing: Listing,
  constraints: SeekerConstraints,
  likedListings: Listing[],
): string[] {
  const reasons: string[] = [];

  if (listing.monthlyRent <= constraints.maxRent) {
    reasons.push("Within budget");
  }
  if (listing.bedrooms === constraints.voucherSize) {
    reasons.push("Matches bedroom need");
  }
  if (constraints.accessibilityNeeds && listing.isGroundFloor) {
    reasons.push("Ground floor");
  }
  const transitHit = listing.transitLines.find((t) =>
    constraints.proximityNeeds.some((n) =>
      t.toLowerCase().includes(n.toLowerCase()),
    ),
  );
  if (transitHit) reasons.push(`Near ${transitHit}`);
  if (listing.landlordVerified) reasons.push("Verified landlord");

  const likedZips = new Set(likedListings.map((l) => l.zipCode));
  if (likedZips.has(listing.zipCode)) reasons.push("Similar area you liked");

  if (reasons.length === 0) {
    const score = scoreListing(listing, constraints, likedListings);
    if (score > 20) reasons.push("Good overall match");
  }

  return reasons.slice(0, 3);
}
