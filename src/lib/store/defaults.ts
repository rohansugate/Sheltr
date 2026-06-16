import { mockSeeker } from "../mock-data";
import type { DiscoverFilters, SeekerConstraints } from "../types";

export const defaultConstraints: SeekerConstraints = mockSeeker.constraints ?? {
  housingSituation: "SHELTER",
  voucherStatus: "HAS_VOUCHER",
  zipCode: "90011",
  voucherSize: 2,
  maxRent: 4000,
  accessibilityNeeds: false,
  proximityNeeds: [],
};

export const defaultDiscoverFilters: DiscoverFilters = {
  maxRent: 4000,
  groundFloorOnly: false,
  neighborhood: "",
};

export function buildListingFetchKey(constraints: SeekerConstraints | null) {
  const c = constraints ?? defaultConstraints;
  return `${c.zipCode}:${c.maxRent}:${c.voucherSize}`;
}
