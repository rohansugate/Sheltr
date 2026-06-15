const LA_METRO_ZIPS = new Set(
  Array.from({ length: 100 }, (_, i) => String(90001 + i)).concat(
    Array.from({ length: 100 }, (_, i) => String(90101 + i)),
    Array.from({ length: 100 }, (_, i) => String(90201 + i)),
    Array.from({ length: 100 }, (_, i) => String(90301 + i)),
    Array.from({ length: 100 }, (_, i) => String(90401 + i)),
    Array.from({ length: 100 }, (_, i) => String(90501 + i)),
    Array.from({ length: 100 }, (_, i) => String(90601 + i)),
    Array.from({ length: 100 }, (_, i) => String(90701 + i)),
    Array.from({ length: 100 }, (_, i) => String(90801 + i)),
  ),
);

export function isValidUsZip(zip: string) {
  return /^\d{5}$/.test(zip);
}

/** Affordable Housing.com Section 8 search URL for a zip. */
export function affordableHousingUrl(zip: string) {
  return `https://www.affordablehousing.com/${zip}-ca/section8-owners/`;
}

/** Broader LA metro Section 8 page when a zip has few direct hits. */
export function affordableHousingMetroUrl() {
  return "https://www.affordablehousing.com/los-angeles-ca/section8-owners/";
}

export function isLosAngelesZip(zip: string) {
  return LA_METRO_ZIPS.has(zip);
}

/** Zillow rentals search for a zip code. */
export function zillowRentalsUrl(zip: string) {
  return `https://www.zillow.com/homes/for_rent/${zip}_rb/`;
}

export function extractZipFromAddress(address: string): string | null {
  const match = address.match(/\b(\d{5})\b/);
  return match?.[1] ?? null;
}
