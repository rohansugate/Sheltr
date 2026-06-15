"use client";

import { Button } from "@/components/ui/button";
import { t, type TranslationKey } from "@/lib/i18n";
import { neighborhoodsForZip } from "@/lib/neighborhoods";
import { useDoorwayStore } from "@/lib/store";

export function DiscoverFilters() {
  const locale = useDoorwayStore((s) => s.locale);
  const filters = useDoorwayStore((s) => s.discoverFilters);
  const constraints = useDoorwayStore((s) => s.constraints);
  const listings = useDoorwayStore((s) => s.listings);
  const setDiscoverFilters = useDoorwayStore((s) => s.setDiscoverFilters);
  const max = constraints?.maxRent ?? 4000;
  const zip = constraints?.zipCode ?? "90011";

  const hoodsFromListings = listings
    .filter((l) => l.status === "ACTIVE")
    .map((l) => l.neighborhood)
    .filter((n): n is string => Boolean(n));
  const hoodsFromZip = neighborhoodsForZip(zip);
  const uniqueHoods = [...new Set([...hoodsFromListings, ...hoodsFromZip])]
    .sort()
    .slice(0, 8);

  return (
    <div className="mx-5 mb-3 rounded-2xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-bold">{t(locale, "filters")}</p>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            {t(locale, "maxRent")}: ${filters.maxRent}
          </label>
          <input
            type="range"
            min={600}
            max={max}
            step={50}
            value={filters.maxRent}
            onChange={(e) =>
              setDiscoverFilters({ maxRent: Number(e.target.value) })
            }
            className="mt-1 h-2 w-full accent-primary"
          />
        </div>
        <Button
          type="button"
          variant={filters.groundFloorOnly ? "primary" : "outline"}
          size="sm"
          onClick={() =>
            setDiscoverFilters({ groundFloorOnly: !filters.groundFloorOnly })
          }
        >
          {t(locale, "groundFloorOnly")}
        </Button>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant={!filters.neighborhood ? "primary" : "outline"}
            size="sm"
            onClick={() => setDiscoverFilters({ neighborhood: "" })}
          >
            {t(locale, "anyNeighborhood")}
          </Button>
          {uniqueHoods.map((hood) => (
            <Button
              key={hood}
              type="button"
              variant={filters.neighborhood === hood ? "primary" : "outline"}
              size="sm"
              onClick={() => setDiscoverFilters({ neighborhood: hood })}
            >
              {hood}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
