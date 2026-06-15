/**
 * Real Section 8–eligible rentals scraped from AffordableHousing.com (Los Angeles, CA).
 * Source: https://www.affordablehousing.com/los-angeles-ca/section8-owners/
 */
import type { Listing } from "./types";
import { DEFAULT_IMAGE, zipToCoords } from "./geo";

const UNSPLASH = [
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
];

type RawListing = {
  address: string;
  neighborhood: string;
  zipCode: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  isGroundFloor?: boolean;
};

/** Parsed from AffordableHousing.com Section 8 search results (June 2026). */
const SCRAPED_LA_SECTION8: RawListing[] = [
  { address: "1738 Colby Ave", neighborhood: "West LA", zipCode: "90025", monthlyRent: 2289, bedrooms: 1, bathrooms: 1 },
  { address: "4032 West Blvd", neighborhood: "Crenshaw", zipCode: "90008", monthlyRent: 1795, bedrooms: 1, bathrooms: 1 },
  { address: "4125 Palmyra Rd", neighborhood: "Crenshaw", zipCode: "90008", monthlyRent: 1350, bedrooms: 1, bathrooms: 1, isGroundFloor: true },
  { address: "3906 Montclair St", neighborhood: "Jefferson Park", zipCode: "90018", monthlyRent: 2100, bedrooms: 1, bathrooms: 1 },
  { address: "1823 S St Andrews Pl", neighborhood: "Mid-City", zipCode: "90019", monthlyRent: 2100, bedrooms: 1, bathrooms: 1 },
  { address: "1110 S Lake St", neighborhood: "Westlake", zipCode: "90006", monthlyRent: 2100, bedrooms: 1, bathrooms: 1 },
  { address: "1625 S St Andrews Pl", neighborhood: "Mid-City", zipCode: "90019", monthlyRent: 2100, bedrooms: 1, bathrooms: 1 },
  { address: "5050 Coliseum St", neighborhood: "Crenshaw", zipCode: "90016", monthlyRent: 2700, bedrooms: 2, bathrooms: 1 },
  { address: "11953 Rochester Ave", neighborhood: "West LA", zipCode: "90025", monthlyRent: 1900, bedrooms: 1, bathrooms: 1 },
  { address: "314 S Oxford Ave", neighborhood: "Koreatown", zipCode: "90020", monthlyRent: 2100, bedrooms: 1, bathrooms: 1 },
  { address: "1415 N Hobart Blvd", neighborhood: "East Hollywood", zipCode: "90027", monthlyRent: 2700, bedrooms: 2, bathrooms: 1 },
  { address: "4133 Redwood Ave", neighborhood: "Mar Vista", zipCode: "90066", monthlyRent: 1900, bedrooms: 1, bathrooms: 1 },
  { address: "3739 Inglewood Blvd", neighborhood: "Mar Vista", zipCode: "90066", monthlyRent: 2100, bedrooms: 1, bathrooms: 1 },
  { address: "1930 S Oxford Ave", neighborhood: "Jefferson Park", zipCode: "90018", monthlyRent: 1350, bedrooms: 1, bathrooms: 1, isGroundFloor: true },
  { address: "836 E 24th St", neighborhood: "South LA", zipCode: "90011", monthlyRent: 2700, bedrooms: 2, bathrooms: 1 },
  { address: "806 S Burlington Ave", neighborhood: "Westlake", zipCode: "90057", monthlyRent: 2100, bedrooms: 1, bathrooms: 1 },
  { address: "12723 Caswell Ave", neighborhood: "Mar Vista", zipCode: "90066", monthlyRent: 2100, bedrooms: 1, bathrooms: 1 },
  { address: "3160 Hollycrest Dr", neighborhood: "Hollywood Hills", zipCode: "90068", monthlyRent: 1900, bedrooms: 1, bathrooms: 1 },
  { address: "1645 Courtney Ave", neighborhood: "Hollywood", zipCode: "90046", monthlyRent: 2100, bedrooms: 1, bathrooms: 1 },
  { address: "12520 Pacific Ave", neighborhood: "Mar Vista", zipCode: "90066", monthlyRent: 2700, bedrooms: 2, bathrooms: 1 },
  { address: "4256 Menlo Ave", neighborhood: "South LA", zipCode: "90037", monthlyRent: 2100, bedrooms: 1, bathrooms: 1 },
  { address: "240 N Van Ness Ave", neighborhood: "Koreatown", zipCode: "90004", monthlyRent: 2100, bedrooms: 1, bathrooms: 1 },
  { address: "100 N Normandie Ave", neighborhood: "Koreatown", zipCode: "90004", monthlyRent: 2000, bedrooms: 1, bathrooms: 1 },
  { address: "1454 W 3rd St", neighborhood: "Downtown LA", zipCode: "90017", monthlyRent: 2400, bedrooms: 1, bathrooms: 1 },
  { address: "222 N Manhattan Pl", neighborhood: "Koreatown", zipCode: "90004", monthlyRent: 2400, bedrooms: 1, bathrooms: 1 },
  { address: "620 W 84th St", neighborhood: "South LA", zipCode: "90044", monthlyRent: 2799, bedrooms: 2, bathrooms: 1 },
  { address: "1425 N Hobart Blvd", neighborhood: "East Hollywood", zipCode: "90027", monthlyRent: 3000, bedrooms: 2, bathrooms: 1 },
  { address: "806 S Burlington Ave #301", neighborhood: "Westlake", zipCode: "90057", monthlyRent: 3000, bedrooms: 2, bathrooms: 1 },
  { address: "1505 W Gage Ave", neighborhood: "South LA", zipCode: "90047", monthlyRent: 3668, bedrooms: 3, bathrooms: 2 },
  { address: "1826 E 66th St", neighborhood: "South LA", zipCode: "90001", monthlyRent: 3800, bedrooms: 3, bathrooms: 1 },
];

function jitterCoords(
  zipCode: string,
  index: number,
): { latitude: number; longitude: number } {
  const base = zipToCoords(zipCode);
  const angle = index * 2.399963;
  return {
    latitude: base.latitude + Math.sin(angle) * 0.012,
    longitude: base.longitude + Math.cos(angle) * 0.015,
  };
}

export function buildSection8Listings(): Listing[] {
  return SCRAPED_LA_SECTION8.map((raw, index) => {
    const coords = jitterCoords(raw.zipCode, index);
    const brLabel = raw.bedrooms === 1 ? "1BR" : `${raw.bedrooms}BR`;
    return {
      id: `listing-${index + 1}`,
      landlordId: "landlord-1",
      title: `${brLabel} Section 8 — ${raw.address}`,
      monthlyRent: raw.monthlyRent,
      bedrooms: raw.bedrooms,
      bathrooms: raw.bathrooms,
      images: [UNSPLASH[index % UNSPLASH.length] ?? DEFAULT_IMAGE],
      isSection8Approved: true,
      isGroundFloor: raw.isGroundFloor ?? false,
      zipCode: raw.zipCode,
      neighborhood: raw.neighborhood,
      transitLines: ["LA Metro", "Bus Line"],
      landlordVerified: true,
      latitude: coords.latitude,
      longitude: coords.longitude,
      source: "IMPORTED",
      status: "ACTIVE",
      analytics: {
        views: 20 + (index % 40),
        saves: 3 + (index % 8),
        applications: index % 4,
      },
    };
  });
}

export const SECTION8_LISTING_COUNT = SCRAPED_LA_SECTION8.length;
