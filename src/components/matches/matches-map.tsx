"use client";

import type { Listing } from "@/lib/types";
import { boundsForListings, pinPosition } from "@/lib/map-bounds";

interface MatchesMapProps {
  listings: Listing[];
  onSelect: (listing: Listing) => void;
}

export function MatchesMap({ listings, onSelect }: MatchesMapProps) {
  const bounds = boundsForListings(listings);

  return (
    <div className="relative mx-4 mb-4 h-72 overflow-hidden rounded-2xl border border-border bg-[#e8f4f0] dark:bg-[#0f1f1a]">
      <p className="absolute left-3 top-3 z-10 text-xs font-semibold text-muted-foreground">
        {bounds.label} area
      </p>
      {listings.map((listing) => {
        const pos = pinPosition(listing.latitude, listing.longitude, bounds);
        return (
          <button
            key={listing.id}
            type="button"
            className="absolute z-10 flex size-8 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-lg transition-transform hover:scale-110"
            style={{ top: pos.top, left: pos.left }}
            aria-label={listing.title}
            onClick={() => onSelect(listing)}
          >
            ♥
          </button>
        );
      })}
    </div>
  );
}
