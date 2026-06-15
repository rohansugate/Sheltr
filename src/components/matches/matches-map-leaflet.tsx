"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Listing } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "",
  html: `<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:#1a1a1a;color:#fff;font-size:14px;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,.25);border:2px solid #fff;">♥</span>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();
  const bounds = useMemo(
    () =>
      listings.map(
        (l) => [l.latitude, l.longitude] as [number, number],
      ),
    [listings],
  );

  useEffect(() => {
    if (bounds.length === 0) return;
    if (bounds.length === 1) {
      map.setView(bounds[0], 13);
      return;
    }
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
  }, [map, bounds]);

  return null;
}

interface MatchesMapLeafletProps {
  listings: Listing[];
  onSelect: (listing: Listing) => void;
}

export function MatchesMapLeaflet({ listings, onSelect }: MatchesMapLeafletProps) {
  const center = useMemo(() => {
    if (listings.length === 0) return { lat: 34.0522, lng: -118.2437 };
    const lat =
      listings.reduce((sum, l) => sum + l.latitude, 0) / listings.length;
    const lng =
      listings.reduce((sum, l) => sum + l.longitude, 0) / listings.length;
    return { lat, lng };
  }, [listings]);

  return (
    <div className="relative mx-4 mb-4 h-72 overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={11}
        scrollWheelZoom={false}
        className="h-full w-full"
        aria-label="Map of saved listings"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds listings={listings} />
        {listings.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.latitude, listing.longitude]}
            icon={pinIcon}
            eventHandlers={{
              click: () => onSelect(listing),
            }}
          >
            <Popup>
              <div className="min-w-[140px] text-sm">
                <p className="font-bold leading-tight">{listing.title}</p>
                <p className="text-primary font-semibold">
                  {formatCurrency(listing.monthlyRent)}/mo
                </p>
                <p className="text-muted-foreground">
                  {listing.neighborhood} · {listing.zipCode}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <p className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-full bg-background/90 px-2 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
        Los Angeles Section 8
      </p>
    </div>
  );
}
