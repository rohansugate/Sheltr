"use client";

import { ListingImage } from "@/components/ui/listing-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ApplicationStatus, Listing, SeekerConstraints } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

function fitsVoucher(listing: Listing, constraints: SeekerConstraints | null) {
  if (!constraints) return true;
  return (
    listing.monthlyRent <= constraints.maxRent &&
    listing.bedrooms >= constraints.voucherSize &&
    (!constraints.accessibilityNeeds || listing.isGroundFloor)
  );
}

function rentPerBed(listing: Listing) {
  return Math.round(listing.monthlyRent / Math.max(listing.bedrooms, 1));
}

type CompareRow = {
  label: string;
  values: React.ReactNode[];
  highlightIndex?: number;
};

interface ListingCompareProps {
  listings: Listing[];
  constraints: SeekerConstraints | null;
  getAppStatus?: (listingId: string) => ApplicationStatus | undefined;
  onView: (listing: Listing) => void;
  onRemove: (listingId: string) => void;
}

export function ListingCompare({
  listings,
  constraints,
  getAppStatus,
  onView,
  onRemove,
}: ListingCompareProps) {
  if (listings.length === 0) return null;

  const n = listings.length;
  const lowestRent = Math.min(...listings.map((l) => l.monthlyRent));
  const lowestRentPerBed = Math.min(...listings.map(rentPerBed));

  const rows: CompareRow[] = [
    {
      label: "Monthly rent",
      values: listings.map((l, i) => (
        <span
          key={l.id}
          className={cn(
            "font-bold",
            l.monthlyRent === lowestRent && n > 1 && "text-emerald-700 dark:text-emerald-400",
          )}
        >
          {formatCurrency(l.monthlyRent)}
          {l.monthlyRent === lowestRent && n > 1 ? " · lowest" : ""}
        </span>
      )),
      highlightIndex:
        n > 1 ? listings.findIndex((l) => l.monthlyRent === lowestRent) : undefined,
    },
    {
      label: "Rent / bedroom",
      values: listings.map((l) => {
        const rpb = rentPerBed(l);
        return (
          <span
            key={l.id}
            className={cn(
              rpb === lowestRentPerBed && n > 1 && "font-semibold text-emerald-700 dark:text-emerald-400",
            )}
          >
            {formatCurrency(rpb)}
          </span>
        );
      }),
      highlightIndex:
        n > 1 ? listings.findIndex((l) => rentPerBed(l) === lowestRentPerBed) : undefined,
    },
    {
      label: "Bedrooms",
      values: listings.map((l) => `${l.bedrooms} bed${l.bedrooms !== 1 ? "s" : ""}`),
      highlightIndex:
        n > 1
          ? listings.reduce(
              (best, l, i) => (l.bedrooms > listings[best].bedrooms ? i : best),
              0,
            )
          : undefined,
    },
    {
      label: "Bathrooms",
      values: listings.map((l) => `${l.bathrooms} bath${l.bathrooms !== 1 ? "s" : ""}`),
    },
    {
      label: "Neighborhood",
      values: listings.map((l) => l.neighborhood ?? "—"),
    },
    {
      label: "Zip code",
      values: listings.map((l) => l.zipCode),
    },
    {
      label: "Section 8",
      values: listings.map((l) => (
        <Badge
          key={l.id}
          variant={l.isSection8Approved ? "success" : "outline"}
          className="text-[10px]"
        >
          {l.isSection8Approved ? "Approved" : "No"}
        </Badge>
      )),
      highlightIndex:
        n > 1
          ? listings.findIndex((l) => l.isSection8Approved)
          : undefined,
    },
    {
      label: "Ground floor",
      values: listings.map((l) => (
        <span key={l.id}>{l.isGroundFloor ? "Yes" : "No"}</span>
      )),
      highlightIndex:
        constraints?.accessibilityNeeds && n > 1
          ? listings.findIndex((l) => l.isGroundFloor)
          : undefined,
    },
    {
      label: "Landlord",
      values: listings.map((l) => (
        <span key={l.id}>{l.landlordVerified ? "Verified" : "Unverified"}</span>
      )),
      highlightIndex:
        n > 1 ? listings.findIndex((l) => l.landlordVerified) : undefined,
    },
    {
      label: "Transit & nearby",
      values: listings.map((l) => (
        <span key={l.id} className="text-xs leading-snug">
          {l.transitLines.length > 0 ? l.transitLines.join(", ") : "—"}
        </span>
      )),
    },
  ];

  if (constraints) {
    rows.push({
      label: "Fits your voucher",
      values: listings.map((l) => {
        const ok = fitsVoucher(l, constraints);
        return (
          <Badge key={l.id} variant={ok ? "success" : "outline"} className="text-[10px]">
            {ok ? "Yes" : "No"}
          </Badge>
        );
      }),
      highlightIndex:
        n > 1 ? listings.findIndex((l) => fitsVoucher(l, constraints)) : undefined,
    });
  }

  if (getAppStatus) {
    rows.push({
      label: "Your status",
      values: listings.map((l) => {
        const status = getAppStatus(l.id);
        return status ? (
          <Badge key={l.id} variant="outline" className="text-[10px]">
            {status.replace(/_/g, " ")}
          </Badge>
        ) : (
          <span key={l.id} className="text-muted-foreground">Not applied</span>
        );
      }),
    });
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      {/* Listing headers */}
      <div
        className="grid min-w-[320px] border-b border-border bg-muted/40"
        style={{ gridTemplateColumns: `6.5rem repeat(${n}, minmax(7.5rem, 1fr))` }}
      >
        <div className="p-3 text-xs font-semibold uppercase text-muted-foreground">Compare</div>
        {listings.map((l) => (
          <div key={l.id} className="flex flex-col gap-2 border-l border-border p-3">
            <div className="relative mx-auto size-16 overflow-hidden rounded-xl bg-muted">
              <ListingImage src={l.images[0]} alt="" fill className="object-cover" sizes="64px" />
            </div>
            <p className="line-clamp-2 text-center text-xs font-bold leading-tight">{l.title}</p>
            <button
              type="button"
              onClick={() => onRemove(l.id)}
              className="text-[10px] font-medium text-muted-foreground underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Attribute rows */}
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid min-w-[320px] border-b border-border last:border-b-0"
          style={{ gridTemplateColumns: `6.5rem repeat(${n}, minmax(7.5rem, 1fr))` }}
        >
          <div className="flex items-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">
            {row.label}
          </div>
          {row.values.map((value, i) => (
            <div
              key={`${row.label}-${listings[i].id}`}
              className={cn(
                "flex items-center border-l border-border px-3 py-2.5 text-sm",
                row.highlightIndex === i && n > 1 && "bg-emerald-50/80 dark:bg-emerald-950/30",
              )}
            >
              {value}
            </div>
          ))}
        </div>
      ))}

      {/* Actions */}
      <div
        className="grid min-w-[320px] bg-muted/20"
        style={{ gridTemplateColumns: `6.5rem repeat(${n}, minmax(7.5rem, 1fr))` }}
      >
        <div className="p-3" />
        {listings.map((l) => (
          <div key={l.id} className="border-l border-border p-3">
            <Button variant="primary" size="sm" className="w-full text-xs" onClick={() => onView(l)}>
              View details
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
