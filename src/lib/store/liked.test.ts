import { describe, expect, it } from "vitest";
import { resolveLikedFromIds } from "@/lib/store/liked";
import type { Listing } from "@/lib/types";

const listings: Listing[] = [
  {
    id: "x",
    landlordId: "l1",
    title: "Saved Place",
    monthlyRent: 2200,
    bedrooms: 2,
    bathrooms: 1,
    images: [],
    isSection8Approved: true,
    isGroundFloor: true,
    zipCode: "90011",
    transitLines: [],
    landlordVerified: true,
    latitude: 34,
    longitude: -118,
    source: "SEED",
    status: "ACTIVE",
    analytics: { views: 1, saves: 1, applications: 0 },
  },
];

describe("resolveLikedFromIds", () => {
  it("resolves ids to live listing objects", () => {
    const result = resolveLikedFromIds(["x", "gone"], listings);
    expect(result).toHaveLength(1);
    expect(result[0]?.monthlyRent).toBe(2200);
  });
});
