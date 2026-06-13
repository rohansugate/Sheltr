import type { Listing } from "./types";

const CITY_BOUNDS: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number; label: string }> = {
  la: { minLat: 33.9, maxLat: 34.15, minLng: -118.35, maxLng: -118.15, label: "Los Angeles" },
  sf: { minLat: 37.72, maxLat: 37.82, minLng: -122.48, maxLng: -122.38, label: "San Francisco" },
  oakland: { minLat: 37.75, maxLat: 37.85, minLng: -122.3, maxLng: -122.2, label: "Oakland" },
  sd: { minLat: 32.68, maxLat: 32.78, minLng: -117.2, maxLng: -117.1, label: "San Diego" },
  sj: { minLat: 37.28, maxLat: 37.38, minLng: -121.95, maxLng: -121.85, label: "San Jose" },
  berkeley: { minLat: 37.84, maxLat: 37.9, minLng: -122.28, maxLng: -122.24, label: "Berkeley" },
};

const ZIP_TO_CITY: Record<string, keyof typeof CITY_BOUNDS> = {
  "90011": "la", "90026": "la", "90037": "la", "90210": "la", "91101": "la", "90802": "la",
  "94102": "sf", "94110": "sf",
  "94601": "oakland", "94607": "oakland",
  "92101": "sd", "92104": "sd",
  "95112": "sj",
  "94704": "berkeley",
  "92501": "la", "92701": "la",
};

export function boundsForListings(listings: Listing[]) {
  if (listings.length === 0) {
    return { ...CITY_BOUNDS.la, label: "California" };
  }

  const cityCounts: Record<string, number> = {};
  for (const l of listings) {
    const city = ZIP_TO_CITY[l.zipCode] ?? "la";
    cityCounts[city] = (cityCounts[city] ?? 0) + 1;
  }
  const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0][0];
  return CITY_BOUNDS[topCity as keyof typeof CITY_BOUNDS] ?? CITY_BOUNDS.la;
}

export function pinPosition(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
) {
  const top = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
  const left = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  return {
    top: `${Math.min(92, Math.max(8, top))}%`,
    left: `${Math.min(92, Math.max(8, left))}%`,
  };
}
