export type ParsedZillowListing = {
  id: string;
  zpid: string;
  address: string;
  zipCode: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  imageUrl: string;
  latitude: number;
  longitude: number;
  title: string;
  sourceUrl?: string;
};

type ZillowListResult = {
  zpid?: string | number;
  price?: string | number;
  unformattedPrice?: number;
  address?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZipcode?: string;
  beds?: number;
  baths?: number;
  imgSrc?: string;
  detailUrl?: string;
  latLong?: { latitude?: number; longitude?: number };
};

function extractListResults(data: Record<string, unknown>): ZillowListResult[] {
  const pageProps = (data.props as Record<string, unknown> | undefined)?.pageProps as
    | Record<string, unknown>
    | undefined;
  const searchPageState = pageProps?.searchPageState as Record<string, unknown> | undefined;
  if (!searchPageState) return [];

  const cat1 = searchPageState.cat1 as Record<string, unknown> | undefined;
  const fromCat1 = (
    cat1?.searchResults as Record<string, unknown> | undefined
  )?.listResults as ZillowListResult[] | undefined;
  if (fromCat1?.length) return fromCat1;

  const direct = searchPageState.listResults as ZillowListResult[] | undefined;
  return direct ?? [];
}

export function parseZillowHtml(html: string, fallbackZip: string): ParsedZillowListing[] {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match?.[1]) return [];

  try {
    const data = JSON.parse(match[1]) as Record<string, unknown>;
    const listResults = extractListResults(data);
    const results: ParsedZillowListing[] = [];

    for (const item of listResults) {
      const zpid = String(item.zpid ?? "");
      if (!zpid) continue;

      const monthlyRent =
        item.unformattedPrice ??
        (typeof item.price === "number"
          ? item.price
          : Number(String(item.price ?? "").replace(/[^\d]/g, "")));
      if (!monthlyRent || monthlyRent < 300) continue;

      const zipCode = item.addressZipcode ?? fallbackZip;
      const street = item.addressStreet ?? item.address ?? "Rental";
      const city = item.addressCity ?? "";
      const state = item.addressState ?? "CA";
      const address = item.address ?? `${street}, ${city}, ${state} ${zipCode}`.trim();

      const bedrooms = Number(item.beds ?? 1) || 1;
      const bathrooms = Number(item.baths ?? 1) || 1;

      results.push({
        id: `zillow-${zpid}`,
        zpid,
        address,
        zipCode,
        monthlyRent,
        bedrooms,
        bathrooms,
        imageUrl: item.imgSrc ?? "",
        latitude: item.latLong?.latitude ?? 0,
        longitude: item.latLong?.longitude ?? 0,
        title: `${bedrooms}BR Rental — ${street}`,
        sourceUrl: item.detailUrl
          ? item.detailUrl.startsWith("http")
            ? item.detailUrl
            : `https://www.zillow.com${item.detailUrl}`
          : undefined,
      });
    }

    return results;
  } catch {
    return [];
  }
}
