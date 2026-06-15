"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/lib/types";

const MatchesMapLeaflet = dynamic(
  () =>
    import("./matches-map-leaflet").then((m) => m.MatchesMapLeaflet),
  {
    ssr: false,
    loading: () => (
      <div className="mx-4 mb-4 flex h-72 items-center justify-center rounded-2xl border border-border bg-muted text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
);

interface MatchesMapProps {
  listings: Listing[];
  onSelect: (listing: Listing) => void;
}

export function MatchesMap({ listings, onSelect }: MatchesMapProps) {
  return <MatchesMapLeaflet listings={listings} onSelect={onSelect} />;
}
