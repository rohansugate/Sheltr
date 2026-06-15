"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { DoorwayHeader } from "@/components/layout/doorway-header";
import { ListingCompare } from "@/components/matches/listing-compare";
import { ListingDetail } from "@/components/matches/listing-detail";
import { MatchesMap } from "@/components/matches/matches-map";
import { ShowingConfirmation } from "@/components/matches/showing-confirmation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingImage } from "@/components/ui/listing-image";
import { t } from "@/lib/i18n";
import { useDoorwayStore } from "@/lib/store";
import type { Listing } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const COMPARE_STORAGE_KEY = "sheltr-compare-ids";

export default function MatchesPage() {
  const likedListings = useDoorwayStore((s) => s.likedListings);
  const locale = useDoorwayStore((s) => s.locale);
  const submitApplication = useDoorwayStore((s) => s.submitApplication);
  const showUiFeedback = useDoorwayStore((s) => s.showUiFeedback);
  const scheduleShowing = useDoorwayStore((s) => s.scheduleShowing);
  const canApply = useDoorwayStore((s) => s.canApply);
  const getShowingForListing = useDoorwayStore((s) => s.getShowingForListing);
  const applications = useDoorwayStore((s) => s.applications);
  const constraints = useDoorwayStore((s) => s.constraints);
  const markSeekerApplicationUpdatesSeen = useDoorwayStore(
    (s) => s.markSeekerApplicationUpdatesSeen,
  );
  const [tab, setTab] = useState<"list" | "map" | "compare">("list");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareReady, setCompareReady] = useState(false);

  useEffect(() => {
    markSeekerApplicationUpdatesSeen();
  }, [markSeekerApplicationUpdatesSeen]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(COMPARE_STORAGE_KEY);
      if (saved) setCompareIds(JSON.parse(saved) as string[]);
    } catch {
      /* ignore */
    }
    setCompareReady(true);
  }, []);

  useEffect(() => {
    if (!compareReady) return;
    sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareIds));
  }, [compareIds, compareReady]);

  const getAppStatus = (listingId: string) =>
    applications.find((a) => a.listingId === listingId)?.status;

  const getMessageHref = (listingId: string) => {
    const app = applications.find((a) => a.listingId === listingId);
    if (app && ["ACCEPTED", "LEASE_SIGNED"].includes(app.status)) {
      return `/messages?conversationId=convo-${app.id}`;
    }
    const showing = getShowingForListing(listingId);
    if (showing?.status === "ACCEPTED") {
      return `/messages?conversationId=convo-showing-${showing.id}`;
    }
    return null;
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev,
    );
  };

  const compareListings = compareIds
    .map((id) => likedListings.find((l) => l.id === id))
    .filter((l): l is Listing => Boolean(l));

  const showCompareTable = tab === "compare" && compareListings.length >= 2;
  const showPicker = tab !== "compare" || compareListings.length < 2;

  return (
    <AppShell>
      <DoorwayHeader subtitle={`${likedListings.length} saved`} />

      <div className="px-5 pb-2">
        {likedListings.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {(["list", "map", "compare"] as const).map((v) => (
              <Button key={v} variant={tab === v ? "primary" : "outline"} size="sm" onClick={() => setTab(v)} className="rounded-full">
                {t(locale, v === "compare" ? "compare" : v)}
              </Button>
            ))}
          </div>
        )}
      </div>

      {likedListings.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <h2 className="text-xl font-bold">{t(locale, "noMatches")}</h2>
          <Link href="/discover"><Button variant="primary" size="md">{t(locale, "goDiscover")}</Button></Link>
        </div>
      ) : (
        <>
          {tab === "map" && <MatchesMap listings={likedListings} onSelect={setSelected} />}
          {tab === "compare" && (
            <div className="flex flex-col gap-4 px-4 pb-2">
              {showCompareTable ? (
                <ListingCompare
                  listings={compareListings}
                  constraints={constraints}
                  locale={locale}
                  getAppStatus={getAppStatus}
                  onView={setSelected}
                  onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {compareListings.length === 1
                    ? t(locale, "compareSelectOneMore")
                    : t(locale, "compareSelect")}
                </p>
              )}
            </div>
          )}
          {showPicker && (
            <ul className="flex flex-col gap-3 px-4 py-4">
              {likedListings.map((listing) => {
                const status = getAppStatus(listing.id);
                const messageHref = getMessageHref(listing.id);
                return (
                  <li key={listing.id} className="flex gap-4 rounded-2xl border border-border bg-card p-3">
                    <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <ListingImage src={listing.images[0]} alt="" fill className="object-cover" sizes="96px" />
                    </div>
                    <div className="flex flex-1 flex-col justify-center gap-1">
                      <h2 className="font-bold leading-tight">{listing.title}</h2>
                      <p className="text-sm text-muted-foreground">{listing.bedrooms} bed · {listing.neighborhood}</p>
                      <p className="font-bold text-primary">{formatCurrency(listing.monthlyRent)}/mo</p>
                      {status && <Badge variant="default" className="w-fit text-xs">{status.replace("_", " ")}</Badge>}
                    </div>
                    <div className="flex shrink-0 flex-col justify-center gap-1">
                      {tab === "compare" && (
                        <Button variant={compareIds.includes(listing.id) ? "primary" : "outline"} size="sm" onClick={() => toggleCompare(listing.id)}>
                          {compareIds.includes(listing.id) ? "✓" : "+"}
                        </Button>
                      )}
                      {messageHref && (
                        <Link href={messageHref}>
                          <Button variant="outline" size="sm">Message</Button>
                        </Link>
                      )}
                      <Button variant="primary" size="sm" onClick={() => setSelected(listing)}>{t(locale, "viewDetails")}</Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {selected && (
        <ListingDetail
          listing={selected}
          locale={locale}
          showing={getShowingForListing(selected.id)}
          canApply={canApply(selected.id)}
          onClose={() => setSelected(null)}
          onApply={(packet) => {
            const ok = submitApplication(selected.id, packet);
            if (ok) {
              showUiFeedback(t(locale, "applicationSent"), "success");
              setSelected(null);
            } else {
              showUiFeedback(t(locale, "applyFailed"), "error");
            }
            return ok;
          }}
          onScheduleShowing={(date, time, contactMethod, contactValue) =>
            scheduleShowing(selected.id, date, time, contactMethod, contactValue)
          }
        />
      )}
      <ShowingConfirmation />
    </AppShell>
  );
}
