import { describe, expect, it } from "vitest";
import { rehydrateLikedListings } from "@/lib/rehydrate-listings";
import type { Listing } from "@/lib/types";

const catalog: Listing[] = [
  {
    id: "a",
    landlordId: "l1",
    title: "Active Home",
    monthlyRent: 2000,
    bedrooms: 2,
    bathrooms: 1,
    images: [],
    isSection8Approved: true,
    isGroundFloor: false,
    zipCode: "90011",
    transitLines: [],
    landlordVerified: true,
    latitude: 34,
    longitude: -118,
    source: "SEED",
    status: "ACTIVE",
    analytics: { views: 0, saves: 0, applications: 0 },
  },
  {
    id: "b",
    landlordId: "l1",
    title: "Inactive Home",
    monthlyRent: 1800,
    bedrooms: 1,
    bathrooms: 1,
    images: [],
    isSection8Approved: true,
    isGroundFloor: false,
    zipCode: "90011",
    transitLines: [],
    landlordVerified: false,
    latitude: 34,
    longitude: -118,
    source: "SEED",
    status: "INACTIVE",
    analytics: { views: 0, saves: 0, applications: 0 },
  },
];

describe("rehydrateLikedListings", () => {
  it("keeps only active listings from catalog", () => {
    const saved = [{ id: "a" }, { id: "b" }, { id: "missing" }] as Listing[];
    const result = rehydrateLikedListings(saved, catalog);
    expect(result.map((l) => l.id)).toEqual(["a"]);
    expect(result[0]?.title).toBe("Active Home");
  });
});
