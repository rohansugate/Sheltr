"use client";

import { useEffect, useState } from "react";
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
import { t } from "@/lib/i18n";
import { useDoorwayStore } from "@/lib/store";

export default function DiscoverPage() {
  const router = useRouter();
  const locale = useDoorwayStore((s) => s.locale);
  const onboardingComplete = useDoorwayStore((s) => s.onboardingComplete);
  const constraints = useDoorwayStore((s) => s.constraints);
  const completeOnboarding = useDoorwayStore((s) => s.completeOnboarding);
  const refreshDeck = useDoorwayStore((s) => s.refreshDeck);
  const fetchListingsByZip = useDoorwayStore((s) => s.fetchListingsByZip);
  const listingsFetchStatus = useDoorwayStore((s) => s.listingsFetchStatus);
  const listingsSourceZip = useDoorwayStore((s) => s.listingsSourceZip);
  const listingsMeta = useDoorwayStore((s) => s.listingsMeta);
  const deck = useDoorwayStore((s) => s.deck);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const zip = constraints?.zipCode ?? "90011";

  useEffect(() => {
    if (!onboardingComplete && !constraints) {
      router.replace("/onboarding");
      return;
    }
    if (!onboardingComplete && constraints) completeOnboarding();
  }, [onboardingComplete, constraints, router, completeOnboarding]);

  useEffect(() => {
    if (!constraints?.zipCode) return;
    if (listingsSourceZip === constraints.zipCode && listingsFetchStatus === "ready") {
      refreshDeck();
      return;
    }
    void fetchListingsByZip();
  }, [
    constraints?.zipCode,
    constraints?.maxRent,
    constraints?.voucherSize,
    listingsSourceZip,
    listingsFetchStatus,
    fetchListingsByZip,
    refreshDeck,
  ]);

  const subtitle =
    listingsFetchStatus === "loading"
      ? t(locale, "searchingListings")
      : `${t(locale, "section8Near")} ${zip}`;

  return (
    <AppShell>
      <DoorwayHeader subtitle={subtitle} />
      <RoleSwitcher compact />

      <div className="flex flex-1 flex-col px-5 pb-2">
        {listingsMeta && listingsFetchStatus === "ready" && (
          <p className="mb-2 text-xs text-muted-foreground">
            {listingsMeta.affordableHousing} Section 8
            {listingsMeta.zillow > 0 ? ` · ${listingsMeta.zillow} from Zillow` : ""}
            {!listingsMeta.zillowConfigured ? ` · ${t(locale, "zillowSetupHint")}` : ""}
          </p>
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
