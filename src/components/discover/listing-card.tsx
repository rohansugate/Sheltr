"use client";

import { Badge } from "@/components/ui/badge";
import { ListingImage } from "@/components/ui/listing-image";
import { getMatchReasons } from "@/lib/match-reasons";
import { t } from "@/lib/i18n";
import { useDoorwayStore } from "@/lib/store";
import type { Listing, Locale } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

interface ListingCardProps {
  listing: Listing;
  locale?: Locale;
  className?: string;
  style?: React.CSSProperties;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerLeave?: (e: React.PointerEvent) => void;
}

export function ListingCard({
  listing,
  locale = "en",
  className,
  style,
  ...pointerHandlers
}: ListingCardProps) {
  const constraints = useDoorwayStore((s) => s.constraints);
  const likedListings = useDoorwayStore((s) => s.likedListings);
  const reasons =
    constraints ? getMatchReasons(listing, constraints, likedListings) : [];

  const summary = [
    listing.title,
    `${listing.bedrooms} bedrooms, ${listing.bathrooms} bathrooms`,
    listing.neighborhood ? `${listing.neighborhood}, ${listing.zipCode}` : listing.zipCode,
    `${formatCurrency(listing.monthlyRent)} per month`,
    listing.isSection8Approved ? t(locale, "section8") : null,
    reasons.length ? `${t(locale, "whyMatch")}: ${reasons.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <article
      className={cn(
        "absolute inset-0 flex flex-col overflow-hidden rounded-3xl bg-card shadow-2xl",
        "border border-border select-none touch-none transition-transform",
        className,
      )}
      style={style}
      aria-label={summary}
      role="group"
      {...pointerHandlers}
    >
      <div className="relative flex-[4] bg-muted">
        <ListingImage
          src={listing.images[0]}
          alt={listing.title}
          fill
          className="object-cover"
          sizes="430px"
          priority
        />
        <div className="absolute left-4 top-4 flex flex-col gap-1.5">
          {listing.isSection8Approved && (
            <Badge variant="success">{t(locale, "section8")}</Badge>
          )}
          {listing.landlordVerified && (
            <Badge variant="outline" className="bg-background/90">
              {t(locale, "landlordVerified")}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-[1] flex-col justify-center gap-1.5 bg-surface px-5 py-4 text-foreground">
        <h2 className="font-serif text-xl leading-tight">{listing.title}</h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
          <span>
            {listing.bedrooms} bed · {listing.bathrooms} bath
          </span>
          <span aria-hidden>·</span>
          <span>
            {listing.neighborhood
              ? `${listing.neighborhood}, ${listing.zipCode}`
              : listing.zipCode}
          </span>
        </div>
        {listing.transitLines.length > 0 && (
          <p className="text-xs text-muted-foreground">{listing.transitLines.join(" · ")}</p>
        )}
        {reasons.length > 0 && (
          <p className="text-xs font-medium text-foreground/70">
            {t(locale, "whyMatch")}: {reasons.join(" · ")}
          </p>
        )}
        <p className="font-serif text-2xl">
          {formatCurrency(listing.monthlyRent)}
          <span className="text-sm font-sans font-normal text-muted-foreground">/mo</span>
        </p>
      </div>
    </article>
  );
}
