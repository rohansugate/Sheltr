"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DoorwayHeader } from "@/components/layout/doorway-header";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { DiscoverFilters } from "@/components/discover/discover-filters";
import { SwipeDeck } from "@/components/discover/swipe-deck";
import { TutorialOverlay } from "@/components/discover/tutorial-overlay";
import { ShowingConfirmation } from "@/components/matches/showing-confirmation";
import { Button } from "@/components/ui/button";
import { SEEKER_DECK_SIZE } from "@/lib/mock-data";
import { buildListingFetchKey } from "@/lib/store/defaults";
import { t } from "@/lib/i18n";
import { useDoorwayStore } from "@/lib/store";
import type { Locale } from "@/lib/types";
import type { ListingCoverage } from "@/lib/listing-search";

function formatUpdatedAgo(iso: string | null, locale: Locale) {
  if (!iso) return null;
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return t(locale, "updatedJustNow");
  if (mins === 1) return t(locale, "updatedOneMinAgo");
  return t(locale, "updatedMinAgo").replace("{mins}", String(mins));
}

function coverageBannerText(
  coverage: ListingCoverage,
  zip: string,
  locale: Locale,
): string | null {
  switch (coverage) {
    case "limited":
      return t(locale, "coverageLimited");
    case "metro":
      return t(locale, "coverageMetro").replace("{zip}", zip);
    case "fallback":
      return t(locale, "coverageFallback").replace("{zip}", zip);
    default:
      return null;
  }
}

function sourceSummaryLine(
  meta: {
    affordableHousing: number;
    zillow: number;
    zillowConfigured: boolean;
  },
  locale: Locale,
): string | null {
  const parts: string[] = [];
  if (meta.affordableHousing > 0) {
    parts.push(
      t(locale, "sourceSection8").replace(
        "{count}",
        String(meta.affordableHousing),
      ),
    );
  }
  if (meta.zillow > 0) {
    parts.push(
      t(locale, "sourceZillow").replace("{count}", String(meta.zillow)),
    );
  }
  if (parts.length === 0) return null;
  if (!meta.zillowConfigured) {
    parts.push(t(locale, "zillowSetupHint"));
  }
  return parts.join(" · ");
}

export default function DiscoverPage() {
  const router = useRouter();
  const locale = useDoorwayStore((s) => s.locale);
  const onboardingComplete = useDoorwayStore((s) => s.onboardingComplete);
  const constraints = useDoorwayStore((s) => s.constraints);
  const completeOnboarding = useDoorwayStore((s) => s.completeOnboarding);
  const refreshDeck = useDoorwayStore((s) => s.refreshDeck);
  const fetchListingsByZip = useDoorwayStore((s) => s.fetchListingsByZip);
  const listingsFetchStatus = useDoorwayStore((s) => s.listingsFetchStatus);
  const listingsFetchKey = useDoorwayStore((s) => s.listingsFetchKey);
  const listingsFetchedAt = useDoorwayStore((s) => s.listingsFetchedAt);
  const listingsMeta = useDoorwayStore((s) => s.listingsMeta);
  const listingsCoverage = useDoorwayStore((s) => s.listingsCoverage);
  const deck = useDoorwayStore((s) => s.deck);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const zip = constraints?.zipCode ?? "90011";
  const desiredFetchKey = useMemo(
    () => (constraints ? buildListingFetchKey(constraints) : null),
    [constraints],
  );

  useEffect(() => {
    if (!onboardingComplete && !constraints) {
      router.replace("/onboarding");
      return;
    }
    if (!onboardingComplete && constraints) completeOnboarding();
  }, [onboardingComplete, constraints, router, completeOnboarding]);

  useEffect(() => {
    if (!constraints?.zipCode || !desiredFetchKey) return;
    if (listingsFetchKey === desiredFetchKey && listingsFetchStatus === "ready") {
      refreshDeck();
      return;
    }
    void fetchListingsByZip();
  }, [
    constraints?.zipCode,
    constraints?.maxRent,
    constraints?.voucherSize,
    desiredFetchKey,
    listingsFetchKey,
    listingsFetchStatus,
    fetchListingsByZip,
    refreshDeck,
  ]);

  const updatedAgo = formatUpdatedAgo(listingsFetchedAt, locale);
  const coverageText =
    listingsCoverage && listingsCoverage !== "zip"
      ? coverageBannerText(listingsCoverage, zip, locale)
      : null;
  const sourceLine =
    listingsMeta && listingsFetchStatus === "ready"
      ? sourceSummaryLine(listingsMeta, locale)
      : null;
  const subtitle =
    listingsFetchStatus === "loading"
      ? t(locale, "searchingListings")
      : `${t(locale, "section8Near")} ${zip}${updatedAgo ? ` · ${updatedAgo}` : ""}`;

  return (
    <AppShell>
      <DoorwayHeader subtitle={subtitle} />
      <RoleSwitcher compact />

      <div className="flex flex-1 flex-col px-5 pb-2">
        {coverageText && listingsFetchStatus === "ready" && (
          <div className="mb-3 rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
            {coverageText}
          </div>
        )}

        {sourceLine && (
          <p className="mb-2 text-xs text-muted-foreground">{sourceLine}</p>
        )}

        {listingsFetchStatus === "error" && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2">
            <p className="text-xs text-destructive">{t(locale, "listingSearchFailed")}</p>
            <Button variant="outline" size="sm" onClick={() => void fetchListingsByZip()}>
              {t(locale, "retry")}
            </Button>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {listingsFetchStatus === "loading"
              ? t(locale, "loadingHomes")
              : `${deck.length} of ${SEEKER_DECK_SIZE} homes`}
          </p>
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase hover:text-foreground"
          >
            {filtersOpen ? t(locale, "hideFilters") : t(locale, "filters")}
          </button>
        </div>

        {filtersOpen && <DiscoverFilters />}

        <div className="flex flex-1 flex-col rounded-[1.75rem] bg-surface p-1">
          <SwipeDeck />
        </div>
      </div>

      <TutorialOverlay />
      <ShowingConfirmation />
    </AppShell>
  );
}
