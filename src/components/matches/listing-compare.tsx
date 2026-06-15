"use client";

import { ListingImage } from "@/components/ui/listing-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { distanceMilesBetween, zipToCoords } from "@/lib/geo";
import { t, type TranslationKey } from "@/lib/i18n";
import { scoreListing } from "@/lib/sort-listings";
import type { ApplicationStatus, Listing, Locale, SeekerConstraints } from "@/lib/types";
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

function proximityMatchCount(listing: Listing, constraints: SeekerConstraints | null) {
  if (!constraints?.proximityNeeds.length) return 0;
  return constraints.proximityNeeds.filter((need) =>
    listing.transitLines.some(
      (line) =>
        line.toLowerCase().includes(need.toLowerCase()) ||
        need.toLowerCase().includes(line.toLowerCase()),
    ),
  ).length;
}

function distanceFromSeeker(listing: Listing, constraints: SeekerConstraints | null) {
  if (!constraints?.zipCode) return null;
  const seekerCoords = zipToCoords(constraints.zipCode);
  return distanceMilesBetween(seekerCoords, listing);
}

type CompareRow = {
  labelKey: TranslationKey;
  values: React.ReactNode[];
  highlightIndex?: number;
};

interface ListingCompareProps {
  listings: Listing[];
  constraints: SeekerConstraints | null;
  locale: Locale;
  getAppStatus?: (listingId: string) => ApplicationStatus | undefined;
  onView: (listing: Listing) => void;
  onRemove: (listingId: string) => void;
}

export function ListingCompare({
  listings,
  constraints,
  locale,
  getAppStatus,
  onView,
  onRemove,
}: ListingCompareProps) {
  if (listings.length === 0) return null;

  const n = listings.length;
  const lowestRent = Math.min(...listings.map((l) => l.monthlyRent));
  const lowestRentPerBed = Math.min(...listings.map(rentPerBed));

  const winner =
    constraints && n > 1
      ? listings.reduce((best, l) =>
          scoreListing(l, constraints, listings) >
          scoreListing(best, constraints, listings)
            ? l
            : best,
        )
      : null;

  const rows: CompareRow[] = [
    {
      labelKey: "compareMonthlyRent",
      values: listings.map((l) => (
        <span
          key={l.id}
          className={cn(
            "font-bold",
            l.monthlyRent === lowestRent && n > 1 && "text-emerald-700 dark:text-emerald-400",
          )}
        >
          {formatCurrency(l.monthlyRent)}
          {l.monthlyRent === lowestRent && n > 1
            ? ` · ${t(locale, "compareLowest")}`
            : ""}
        </span>
      )),
      highlightIndex:
        n > 1 ? listings.findIndex((l) => l.monthlyRent === lowestRent) : undefined,
    },
    {
      labelKey: "compareRentPerBed",
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
      labelKey: "compareBedrooms",
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
      labelKey: "compareBathrooms",
      values: listings.map((l) => `${l.bathrooms} bath${l.bathrooms !== 1 ? "s" : ""}`),
    },
    {
      labelKey: "compareNeighborhood",
      values: listings.map((l) => l.neighborhood ?? "—"),
    },
    {
      labelKey: "compareZip",
      values: listings.map((l) => l.zipCode),
    },
  ];

  if (constraints?.zipCode) {
    const distances = listings.map((l) => distanceFromSeeker(l, constraints));
    const closest = Math.min(...distances.filter((d): d is number => d !== null));
    rows.push({
      labelKey: "compareDistance",
      values: listings.map((l) => {
        const miles = distanceFromSeeker(l, constraints);
        if (miles === null) return "—";
        return (
          <span
            key={l.id}
            className={cn(
              miles === closest && n > 1 && "font-semibold text-emerald-700 dark:text-emerald-400",
            )}
          >
            {miles.toFixed(1)} {t(locale, "compareMiles")}
          </span>
        );
      }),
      highlightIndex:
        n > 1 ? distances.findIndex((d) => d === closest) : undefined,
    });
  }

  rows.push(
    {
      labelKey: "compareSection8",
      values: listings.map((l) => (
        <Badge
          key={l.id}
          variant={l.isSection8Approved ? "success" : "outline"}
          className="text-[10px]"
        >
          {l.isSection8Approved ? t(locale, "compareApproved") : t(locale, "compareNo")}
        </Badge>
      )),
      highlightIndex:
        n > 1 ? listings.findIndex((l) => l.isSection8Approved) : undefined,
    },
    {
      labelKey: "compareGroundFloor",
      values: listings.map((l) => (
        <span key={l.id}>
          {l.isGroundFloor ? t(locale, "compareYes") : t(locale, "compareNo")}
        </span>
      )),
      highlightIndex:
        constraints?.accessibilityNeeds && n > 1
          ? listings.findIndex((l) => l.isGroundFloor)
          : undefined,
    },
    {
      labelKey: "compareLandlord",
      values: listings.map((l) => (
        <span key={l.id}>
          {l.landlordVerified
            ? t(locale, "compareVerified")
            : t(locale, "compareUnverified")}
        </span>
      )),
      highlightIndex:
        n > 1 ? listings.findIndex((l) => l.landlordVerified) : undefined,
    },
    {
      labelKey: "compareTransit",
      values: listings.map((l) => (
        <span key={l.id} className="text-xs leading-snug">
          {l.transitLines.length > 0 ? l.transitLines.join(", ") : "—"}
        </span>
      )),
    },
    {
      labelKey: "comparePets",
      values: listings.map((l) => (
        <span key={l.id}>
          {l.petsAllowed ? t(locale, "compareYes") : t(locale, "compareNo")}
        </span>
      )),
      highlightIndex:
        n > 1 ? listings.findIndex((l) => l.petsAllowed) : undefined,
    },
    {
      labelKey: "compareUtilities",
      values: listings.map((l) => (
        <span key={l.id} className="text-xs leading-snug">
          {l.utilitiesIncluded ?? "—"}
        </span>
      )),
    },
    {
      labelKey: "compareAvailable",
      values: listings.map((l) => (
        <span key={l.id} className="text-xs">
          {l.availableDate
            ? new Date(l.availableDate).toLocaleDateString(locale, {
                month: "short",
                day: "numeric",
              })
            : "—"}
        </span>
      )),
    },
  );

  if (constraints?.proximityNeeds.length) {
    const counts = listings.map((l) => proximityMatchCount(l, constraints));
    const bestCount = Math.max(...counts);
    rows.push({
      labelKey: "compareProximity",
      values: listings.map((l, i) => (
        <span
          key={l.id}
          className={cn(
            counts[i] === bestCount && bestCount > 0 && n > 1 &&
              "font-semibold text-emerald-700 dark:text-emerald-400",
          )}
        >
          {counts[i]}/{constraints.proximityNeeds.length} matched
        </span>
      )),
      highlightIndex:
        n > 1 && bestCount > 0 ? counts.findIndex((c) => c === bestCount) : undefined,
    });
  }

  if (constraints) {
    rows.push({
      labelKey: "compareFitsVoucher",
      values: listings.map((l) => {
        const ok = fitsVoucher(l, constraints);
        return (
          <Badge key={l.id} variant={ok ? "success" : "outline"} className="text-[10px]">
            {ok ? t(locale, "compareYes") : t(locale, "compareNo")}
          </Badge>
        );
      }),
      highlightIndex:
        n > 1 ? listings.findIndex((l) => fitsVoucher(l, constraints)) : undefined,
    });
  }

  if (getAppStatus) {
    rows.push({
      labelKey: "compareYourStatus",
      values: listings.map((l) => {
        const status = getAppStatus(l.id);
        return status ? (
          <Badge key={l.id} variant="outline" className="text-[10px]">
            {status.replace(/_/g, " ")}
          </Badge>
        ) : (
          <span key={l.id} className="text-muted-foreground">
            {t(locale, "compareNotApplied")}
          </span>
        );
      }),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {winner && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
            {t(locale, "compareBestPick")}
          </p>
          <p className="mt-1 font-bold leading-tight">{winner.title}</p>
          <p className="text-sm text-emerald-900/80 dark:text-emerald-200/80">
            {formatCurrency(winner.monthlyRent)}/mo · {winner.neighborhood} ·{" "}
            {winner.bedrooms} bed
          </p>
        </div>
      )}

      <div
        className="overflow-x-auto rounded-2xl border border-border bg-card"
        role="table"
        aria-label={t(locale, "compare")}
      >
        <div
          className="grid min-w-[320px] border-b border-border bg-muted/40"
          style={{ gridTemplateColumns: `6.5rem repeat(${n}, minmax(7.5rem, 1fr))` }}
          role="row"
        >
          <div className="p-3 text-xs font-semibold uppercase text-muted-foreground" role="columnheader">
            {t(locale, "compare")}
          </div>
          {listings.map((l) => (
            <div key={l.id} className="flex flex-col gap-2 border-l border-border p-3" role="columnheader">
              <div className="relative mx-auto size-16 overflow-hidden rounded-xl bg-muted">
                <ListingImage src={l.images[0]} alt="" fill className="object-cover" sizes="64px" />
              </div>
              <p className="line-clamp-2 text-center text-xs font-bold leading-tight">{l.title}</p>
              <button
                type="button"
                onClick={() => onRemove(l.id)}
                className="text-[10px] font-medium text-muted-foreground underline"
              >
                {t(locale, "compareRemove")}
              </button>
            </div>
          ))}
        </div>

        {rows.map((row) => (
          <div
            key={row.labelKey}
            className="grid min-w-[320px] border-b border-border last:border-b-0"
            style={{ gridTemplateColumns: `6.5rem repeat(${n}, minmax(7.5rem, 1fr))` }}
            role="row"
          >
            <div
              className="flex items-center px-3 py-2.5 text-xs font-semibold text-muted-foreground"
              role="rowheader"
            >
              {t(locale, row.labelKey)}
            </div>
            {row.values.map((value, i) => (
              <div
                key={`${row.labelKey}-${listings[i].id}`}
                className={cn(
                  "flex items-center border-l border-border px-3 py-2.5 text-sm",
                  row.highlightIndex === i && n > 1 && "bg-emerald-50/80 dark:bg-emerald-950/30",
                )}
                role="cell"
              >
                {value}
              </div>
            ))}
          </div>
        ))}

        <div
          className="grid min-w-[320px] bg-muted/20"
          style={{ gridTemplateColumns: `6.5rem repeat(${n}, minmax(7.5rem, 1fr))` }}
        >
          <div className="p-3" />
          {listings.map((l) => (
            <div key={l.id} className="border-l border-border p-3">
              <Button variant="primary" size="sm" className="w-full text-xs" onClick={() => onView(l)}>
                {t(locale, "viewDetails")}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
