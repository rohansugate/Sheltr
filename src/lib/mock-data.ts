import type { Listing, User } from "./types";
import { buildSection8Listings } from "./section8-listings";

export const SEEKER_DECK_SIZE = 30;

/** Live Section 8 listings sourced from AffordableHousing.com (Los Angeles). */
export const mockListings: Listing[] = buildSection8Listings();

export const mockSeeker: User = {
  id: "seeker-1",
  role: "SEEKER",
  firstName: "Maria",
  lastName: "Garcia",
  email: "maria@example.com",
  accountStatus: "ACTIVE",
  constraints: {
    housingSituation: "SHELTER",
    voucherStatus: "HAS_VOUCHER",
    zipCode: "90011",
    voucherSize: 2,
    maxRent: 4000,
    accessibilityNeeds: false,
    proximityNeeds: ["LA Metro", "Clinic nearby"],
  },
};

export const mockLandlord: User = {
  id: "landlord-1",
  role: "LANDLORD",
  firstName: "Patricia",
  lastName: "Williams",
  email: "pwilliams@properties.com",
  accountStatus: "ACTIVE",
};

export function filterListingsForSeeker(
  listings: Listing[],
  constraints: User["constraints"],
): Listing[] {
  if (!constraints) return listings.filter((l) => l.status === "ACTIVE");

  return listings.filter(
    (listing) =>
      listing.status === "ACTIVE" &&
      listing.monthlyRent <= constraints.maxRent &&
      listing.bedrooms >= constraints.voucherSize &&
      (!constraints.accessibilityNeeds || listing.isGroundFloor),
  );
}

export { DEFAULT_IMAGE, zipToCoords } from "./geo";
