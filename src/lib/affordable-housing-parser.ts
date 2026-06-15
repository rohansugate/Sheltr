import { extractZipFromAddress } from "./zip-search";

export type ParsedAffordableListing = {
  id: string;
  address: string;
  zipCode: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  imageUrl: string;
  isSection8Approved: boolean;
  landlordVerified: boolean;
  title: string;
  sourceUrl?: string;
};

function parsePrice(raw: string): number {
  const nums = raw.match(/\$[\d,]+/g)?.map((s) => Number(s.replace(/[$,]/g, ""))) ?? [];
  if (nums.length === 0) return 0;
  return Math.min(...nums);
}

function parseBedrooms(raw: string): number {
  const studio = /studio/i.test(raw);
  if (studio) return 1;
  const range = raw.match(/(\d+)\s*-\s*(\d+)/);
  if (range) return Number(range[1]);
  const single = raw.match(/(\d+)\s*<span class="card--value">bed/i);
  return single ? Number(single[1]) : 1;
}

function parseBathrooms(raw: string): number {
  const range = raw.match(/(\d+)\s*-\s*(\d+)\s*<span class="card--value">bath/i);
  if (range) return Number(range[1]);
  const single = raw.match(/(\d+)\s*<span class="card--value">bath/i);
  return single ? Number(single[1]) : 1;
}

export function parseAffordableHousingHtml(
  html: string,
  targetZip?: string,
): ParsedAffordableListing[] {
  const cards = html.match(
    /<div class='premiumcard jq-cardhover'[\s\S]*?(?=<div class='premiumcard jq-cardhover'|<div class="paging-wrap|$)/g,
  );
  if (!cards?.length) return [];

  const results: ParsedAffordableListing[] = [];

  for (const card of cards) {
    const communityMatch = card.match(/data-communityid='(\d+)'/);
    const communityId = communityMatch?.[1];
    if (!communityId) continue;

    const priceMatch = card.match(
      /<div class='premiumcard--price'>([^<]+)<\/div>/,
    );
    const monthlyRent = priceMatch ? parsePrice(priceMatch[1]) : 0;
    if (!monthlyRent) continue;

    const detailsMatch = card.match(
      /<div class='premiumcard--details'>([\s\S]*?)<\/div>/,
    );
    const details = detailsMatch?.[1] ?? "";
    const bedrooms = parseBedrooms(details);
    const bathrooms = parseBathrooms(details);

    const addressMatch = card.match(
      /<div class='tnresult--propertyaddress'>([^<]+)<\/div>/,
    );
    const address = addressMatch?.[1]?.trim() ?? "Los Angeles, CA";
    const zipCode = extractZipFromAddress(address) ?? targetZip ?? "90011";

    const nameMatch = card.match(
      /<div class='premiumcard--communityname'><span>([^<]*)<\/span>/,
    );
    const communityName = nameMatch?.[1]?.trim();

    const imgMatch = card.match(/<img src='([^']+)' loading='lazy'>/);
    const imageUrl = imgMatch?.[1] ?? "";

    const hrefMatch = card.match(
      /<a href='(https:\/\/www\.affordablehousing\.com[^']+)'/,
    );

    const isSection8 = card.includes("ic--go8--badge");
    const landlordVerified = card.includes("trusted--owner");

    const title =
      communityName && communityName.length > 0
        ? `${bedrooms}BR Section 8 — ${communityName}`
        : `${bedrooms}BR Section 8 — ${address.split(",")[0]}`;

    results.push({
      id: `ah-${communityId}`,
      address,
      zipCode,
      monthlyRent,
      bedrooms,
      bathrooms,
      imageUrl,
      isSection8Approved: isSection8,
      landlordVerified,
      title,
      sourceUrl: hrefMatch?.[1],
    });
  }

  return results;
}
