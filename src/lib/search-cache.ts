import type { ListingSearchResult } from "./listing-search";

const memoryCache = new Map<string, { data: ListingSearchResult; expiresAt: number }>();

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function hasRedisEnv() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

export function searchCacheKey(
  zip: string,
  maxRent?: number,
  minBedrooms?: number,
) {
  return `sheltr:search:${zip}:${maxRent ?? 0}:${minBedrooms ?? 0}`;
}

export async function readSearchCache(
  key: string,
): Promise<ListingSearchResult | null> {
  if (hasRedisEnv()) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = Redis.fromEnv();
      return (await redis.get<ListingSearchResult>(key)) ?? null;
    } catch {
      /* fall through */
    }
  }

  const hit = memoryCache.get(key);
  if (!hit || Date.now() > hit.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return hit.data;
}

export async function writeSearchCache(
  key: string,
  data: ListingSearchResult,
): Promise<void> {
  if (hasRedisEnv()) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = Redis.fromEnv();
      await redis.set(key, data, { ex: Math.floor(CACHE_TTL_MS / 1000) });
      return;
    } catch {
      /* fall through */
    }
  }

  memoryCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}
